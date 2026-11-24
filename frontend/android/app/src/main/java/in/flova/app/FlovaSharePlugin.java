package in.flova.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

@CapacitorPlugin(name = "FlovaSharePlugin")
public class FlovaSharePlugin extends Plugin {

    private static String pendingShareToken = null;

    public static void setPendingShareToken(String token) {
        pendingShareToken = token;
    }

    @PluginMethod
    public void getPendingShareToken(PluginCall call) {
        com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
        ret.put("token", pendingShareToken);
        pendingShareToken = null; // one-time retrieval
        call.resolve(ret);
    }

    @PluginMethod
    public void claimSharedPayload(PluginCall call) {
        String token = call.getString("token");
        String clientClaimId = call.getString("clientClaimId");

        if (token == null || token.trim().isEmpty()) {
            call.reject("Token is required");
            return;
        }

        try {
            JSONObject res = FlovaShareStore.claimPayload(getContext(), token, clientClaimId);
            call.resolve(com.getcapacitor.JSObject.fromJSONObject(res));
        } catch (Exception e) {
            call.reject("Failed to claim payload: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void renewSharedPayloadLease(PluginCall call) {
        String token = call.getString("token");
        String claimId = call.getString("claimId");

        if (token == null || claimId == null) {
            call.reject("Token and claimId are required");
            return;
        }

        try {
            JSONObject res = FlovaShareStore.renewLease(getContext(), token, claimId);
            call.resolve(com.getcapacitor.JSObject.fromJSONObject(res));
        } catch (Exception e) {
            call.reject("Failed to renew lease: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void acknowledgeSharedPayload(PluginCall call) {
        String token = call.getString("token");
        String claimId = call.getString("claimId");

        if (token == null || claimId == null) {
            call.reject("Token and claimId are required");
            return;
        }

        try {
            JSONObject res = FlovaShareStore.acknowledgePayload(getContext(), token, claimId);
            call.resolve(com.getcapacitor.JSObject.fromJSONObject(res));
        } catch (Exception e) {
            call.reject("Failed to acknowledge payload: " + e.getMessage(), e);
        }
    }
}
