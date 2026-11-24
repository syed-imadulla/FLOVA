package in.flova.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static final long MAX_IMAGE_BYTES = 15 * 1024 * 1024L; // 15MB
    private final ExecutorService backgroundExecutor = Executors.newSingleThreadExecutor();

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FlovaSharePlugin.class);
        super.onCreate(savedInstanceState);
        handleSendIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleSendIntent(intent);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        backgroundExecutor.shutdown();
    }

    private void handleSendIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null) {
            Log.d(TAG, "Received ACTION_SEND with MIME: " + type);

            if (type.startsWith("text/")) {
                handleSendText(intent);
            } else if (type.startsWith("image/")) {
                handleSendImage(intent);
            }
        }
    }

    private void handleSendText(Intent intent) {
        String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (sharedText == null || sharedText.trim().isEmpty()) {
            CharSequence charSeq = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
            if (charSeq != null) sharedText = charSeq.toString();
        }

        if (sharedText != null && !sharedText.trim().isEmpty()) {
            try {
                // Bound text length to 4KB
                if (sharedText.length() > 4096) {
                    sharedText = sharedText.substring(0, 4096);
                }
                String token = FlovaShareStore.storeText(this, sharedText);
                dispatchTokenToWebView(token);
            } catch (Exception e) {
                Log.e(TAG, "Failed to store shared text: " + e.getMessage(), e);
            }
        }
    }

    private void handleSendImage(Intent intent) {
        Uri streamUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (streamUri == null) {
            Log.w(TAG, "No EXTRA_STREAM URI in ACTION_SEND intent");
            return;
        }

        // Copy off the main thread immediately while transient URI read permission is active
        backgroundExecutor.execute(() -> {
            File tmpFile = null;
            try {
                File cacheDir = new File(getCacheDir(), "shared_receipts_tmp");
                if (!cacheDir.exists()) cacheDir.mkdirs();

                tmpFile = new File(cacheDir, "recv_" + UUID.randomUUID().toString() + ".tmp");
                try (InputStream in = getContentResolver().openInputStream(streamUri);
                     FileOutputStream out = new FileOutputStream(tmpFile)) {

                    if (in == null) {
                        Log.e(TAG, "Unable to open input stream for shared image content");
                        return;
                    }

                    byte[] buffer = new byte[16384];
                    int bytesRead;
                    long totalBytes = 0;

                    while ((bytesRead = in.read(buffer)) != -1) {
                        totalBytes += bytesRead;
                        if (totalBytes > MAX_IMAGE_BYTES) {
                            Log.e(TAG, "Shared image exceeds max 15MB limit. Aborting.");
                            tmpFile.delete();
                            return;
                        }
                        out.write(buffer, 0, bytesRead);
                    }
                    out.flush();
                }

                // File copied successfully -> store in authoritative FlovaShareStore
                String token = FlovaShareStore.storeImage(this, tmpFile);
                runOnUiThread(() -> dispatchTokenToWebView(token));

            } catch (Exception e) {
                Log.e(TAG, "Failed to copy shared image stream: " + e.getMessage(), e);
                if (tmpFile != null && tmpFile.exists()) {
                    tmpFile.delete();
                }
            }
        });
    }

    private void dispatchTokenToWebView(String token) {
        FlovaSharePlugin.setPendingShareToken(token);
        if (getBridge() != null && getBridge().getWebView() != null) {
            String routeUrl = "/catch?sharedToken=" + Uri.encode(token);
            Log.d(TAG, "Navigating WebView to catch screen");
            String js = "try { "
                + "  window.dispatchEvent(new CustomEvent('flovaShareIntent', { detail: { token: '" + token + "' } })); "
                + "  if (window.location && window.location.origin && !'null'.equals(window.location.origin) && !window.location.href.startsWith('about:')) { "
                + "    window.history.pushState({}, '', '" + routeUrl + "'); "
                + "    window.dispatchEvent(new PopStateEvent('popstate')); "
                + "  } "
                + "} catch (e) { console.error('dispatchToken error', e); }";
            getBridge().getWebView().evaluateJavascript(js, null);
        }
    }
}
