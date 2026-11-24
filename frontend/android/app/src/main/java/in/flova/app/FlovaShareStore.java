package in.flova.app;

import android.content.Context;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Authoritative native store for incoming shared UPI text and receipts.
 * Stores metadata and images on app-private internal disk (/flova_shares/).
 * Features:
 * - 15-minute global payload TTL (expiresAt)
 * - 60-second recoverable claim lease (claimExpiresAt)
 * - Heartbeat lease renewal
 * - Stale claim rejection ("lease_lost")
 * - Atomic one-time acknowledgment & disk deletion
 */
public class FlovaShareStore {
    private static final String TAG = "FlovaShareStore";
    private static final String SHARES_DIR = "flova_shares";
    public static final long PAYLOAD_TTL_MS = 15 * 60 * 1000L; // 15 mins
    public static final long LEASE_DURATION_MS = 60 * 1000L;    // 60 secs

    private static final Object LOCK = new Object();

    public static File getSharesDir(Context context) {
        File dir = new File(context.getCacheDir(), SHARES_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return dir;
    }

    /**
     * Purges expired payloads from disk. Called on app initialization.
     */
    public static void pruneExpired(Context context) {
        synchronized (LOCK) {
            File dir = getSharesDir(context);
            File[] files = dir.listFiles((d, name) -> name.endsWith(".json"));
            if (files == null) return;
            long now = System.currentTimeMillis();
            for (File jsonFile : files) {
                try {
                    JSONObject obj = readJson(jsonFile);
                    if (now > obj.optLong("expiresAt", 0)) {
                        String imagePath = obj.optString("imagePath", null);
                        if (imagePath != null) {
                            new File(imagePath).delete();
                        }
                        jsonFile.delete();
                        Log.d(TAG, "Pruned expired share payload: " + jsonFile.getName());
                    }
                } catch (Exception e) {
                    jsonFile.delete();
                }
            }
        }
    }

    /**
     * Stores incoming shared text in a new payload. Returns token.
     */
    public static String storeText(Context context, String text) throws IOException, JSONException {
        synchronized (LOCK) {
            pruneExpired(context);
            String token = UUID.randomUUID().toString();
            long now = System.currentTimeMillis();

            JSONObject obj = new JSONObject();
            obj.put("token", token);
            obj.put("type", "text");
            obj.put("textContent", text);
            obj.put("imagePath", JSONObject.NULL);
            obj.put("createdAt", now);
            obj.put("expiresAt", now + PAYLOAD_TTL_MS);
            obj.put("status", "PENDING");
            obj.put("claimId", JSONObject.NULL);
            obj.put("claimExpiresAt", 0L);

            File jsonFile = new File(getSharesDir(context), token + ".json");
            writeJson(jsonFile, obj);
            return token;
        }
    }

    /**
     * Stores incoming image from a completed local cached file. Returns token.
     */
    public static String storeImage(Context context, File cachedImageFile) throws IOException, JSONException {
        synchronized (LOCK) {
            pruneExpired(context);
            String token = UUID.randomUUID().toString();
            long now = System.currentTimeMillis();

            File targetImageFile = new File(getSharesDir(context), token + ".jpg");
            if (!cachedImageFile.renameTo(targetImageFile)) {
                // Fallback copy if cross-filesystem or rename fails
                copyFile(cachedImageFile, targetImageFile);
                cachedImageFile.delete();
            }

            JSONObject obj = new JSONObject();
            obj.put("token", token);
            obj.put("type", "image");
            obj.put("textContent", JSONObject.NULL);
            obj.put("imagePath", targetImageFile.getAbsolutePath());
            obj.put("createdAt", now);
            obj.put("expiresAt", now + PAYLOAD_TTL_MS);
            obj.put("status", "PENDING");
            obj.put("claimId", JSONObject.NULL);
            obj.put("claimExpiresAt", 0L);

            File jsonFile = new File(getSharesDir(context), token + ".json");
            writeJson(jsonFile, obj);
            return token;
        }
    }

    /**
     * Claims the shared payload using a recoverable lease.
     */
    public static JSONObject claimPayload(Context context, String token, String preferredClaimId) throws JSONException, IOException {
        synchronized (LOCK) {
            File jsonFile = new File(getSharesDir(context), token + ".json");
            if (!jsonFile.exists()) {
                JSONObject res = new JSONObject();
                res.put("status", "not_found");
                return res;
            }

            JSONObject obj = readJson(jsonFile);
            long now = System.currentTimeMillis();

            if (now > obj.optLong("expiresAt", 0)) {
                cleanupPayloadFiles(obj, jsonFile);
                JSONObject res = new JSONObject();
                res.put("status", "expired");
                return res;
            }

            String currentStatus = obj.optString("status", "PENDING");
            String existingClaimId = obj.isNull("claimId") ? null : obj.optString("claimId");
            long claimExpiresAt = obj.optLong("claimExpiresAt", 0);

            String activeClaimId;

            if ("CLAIMED".equals(currentStatus) && now <= claimExpiresAt) {
                // Active lease in effect: reject other clients
                if (preferredClaimId != null && !preferredClaimId.equals(existingClaimId)) {
                    JSONObject res = new JSONObject();
                    res.put("status", "already_claimed");
                    return res;
                }
                // Same-session recovery (preferredClaimId matches) or empty sessionStorage recovery (preferredClaimId == null)
                activeClaimId = existingClaimId;
                obj.put("claimExpiresAt", Math.min(now + LEASE_DURATION_MS, obj.optLong("expiresAt")));
                writeJson(jsonFile, obj);
            } else {
                // Status is PENDING or previous lease expired -> issue new lease
                activeClaimId = (preferredClaimId != null && !preferredClaimId.isEmpty()) 
                    ? preferredClaimId 
                    : UUID.randomUUID().toString();
                obj.put("status", "CLAIMED");
                obj.put("claimId", activeClaimId);
                obj.put("claimExpiresAt", Math.min(now + LEASE_DURATION_MS, obj.optLong("expiresAt")));
                writeJson(jsonFile, obj);
            }

            JSONObject payload = new JSONObject();
            payload.put("type", obj.optString("type"));
            if ("text".equals(obj.optString("type"))) {
                payload.put("textContent", obj.optString("textContent"));
            } else {
                payload.put("imagePath", obj.optString("imagePath"));
            }

            JSONObject res = new JSONObject();
            res.put("status", "ok");
            res.put("claimId", activeClaimId);
            res.put("payload", payload);
            return res;
        }
    }

    /**
     * Heartbeat renewal of an active lease.
     */
    public static JSONObject renewLease(Context context, String token, String claimId) throws JSONException, IOException {
        synchronized (LOCK) {
            File jsonFile = new File(getSharesDir(context), token + ".json");
            if (!jsonFile.exists()) {
                JSONObject res = new JSONObject();
                res.put("status", "not_found");
                return res;
            }

            JSONObject obj = readJson(jsonFile);
            long now = System.currentTimeMillis();

            if (now > obj.optLong("expiresAt", 0)) {
                cleanupPayloadFiles(obj, jsonFile);
                JSONObject res = new JSONObject();
                res.put("status", "expired");
                return res;
            }

            String existingClaimId = obj.isNull("claimId") ? null : obj.optString("claimId");
            if (existingClaimId == null || !existingClaimId.equals(claimId)) {
                JSONObject res = new JSONObject();
                res.put("status", "lease_lost");
                return res;
            }

            // Extend lease
            obj.put("claimExpiresAt", Math.min(now + LEASE_DURATION_MS, obj.optLong("expiresAt")));
            writeJson(jsonFile, obj);

            JSONObject res = new JSONObject();
            res.put("status", "ok");
            return res;
        }
    }

    /**
     * Acknowledges successful consumption and atomically deletes disk files.
     */
    public static JSONObject acknowledgePayload(Context context, String token, String claimId) throws JSONException, IOException {
        synchronized (LOCK) {
            File jsonFile = new File(getSharesDir(context), token + ".json");
            if (!jsonFile.exists()) {
                JSONObject res = new JSONObject();
                res.put("status", "not_found");
                return res;
            }

            JSONObject obj = readJson(jsonFile);
            String existingClaimId = obj.isNull("claimId") ? null : obj.optString("claimId");

            if (existingClaimId != null && !existingClaimId.equals(claimId)) {
                JSONObject res = new JSONObject();
                res.put("status", "lease_lost");
                return res;
            }

            cleanupPayloadFiles(obj, jsonFile);

            JSONObject res = new JSONObject();
            res.put("status", "ok");
            return res;
        }
    }

    private static void cleanupPayloadFiles(JSONObject obj, File jsonFile) {
        String imagePath = obj.optString("imagePath", null);
        if (imagePath != null) {
            new File(imagePath).delete();
        }
        jsonFile.delete();
    }

    private static JSONObject readJson(File file) throws IOException, JSONException {
        try (FileInputStream fis = new FileInputStream(file)) {
            byte[] data = new byte[(int) file.length()];
            fis.read(data);
            return new JSONObject(new String(data, StandardCharsets.UTF_8));
        }
    }

    private static void writeJson(File file, JSONObject json) throws IOException {
        File tmp = new File(file.getParentFile(), file.getName() + ".tmp");
        try (FileOutputStream fos = new FileOutputStream(tmp)) {
            fos.write(json.toString().getBytes(StandardCharsets.UTF_8));
            fos.flush();
        }
        if (!tmp.renameTo(file)) {
            tmp.delete();
            throw new IOException("Failed to atomically rename JSON file: " + file.getName());
        }
    }

    private static void copyFile(File src, File dst) throws IOException {
        try (InputStream in = new FileInputStream(src);
             FileOutputStream out = new FileOutputStream(dst)) {
            byte[] buf = new byte[8192];
            int len;
            while ((len = in.read(buf)) > 0) {
                out.write(buf, 0, len);
            }
        }
    }
}
