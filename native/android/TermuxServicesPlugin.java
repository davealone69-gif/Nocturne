package com.nocturne.app;

import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TermuxServices")
public class TermuxServicesPlugin extends Plugin {
    private static final String TERMUX_PACKAGE = "com.termux";
    private static final String RUN_COMMAND_PERMISSION = "com.termux.permission.RUN_COMMAND";
    private static final String SCRIPT_PATH = "/data/data/com.termux/files/home/.local/bin/nocturne-services";

    @PluginMethod
    public void run(PluginCall call) {
        String action = call.getString("action", "start");
        if (!"start".equals(action) && !"stop".equals(action) && !"status".equals(action)) {
            call.reject("Unsupported service action.");
            return;
        }
        if (getContext().getPackageManager().getLaunchIntentForPackage(TERMUX_PACKAGE) == null) {
            call.reject("Termux is not installed. Install Termux from F-Droid and run the Nocturne setup script.");
            return;
        }
        if (Build.VERSION.SDK_INT >= 23 &&
            getContext().checkSelfPermission(RUN_COMMAND_PERMISSION) != PackageManager.PERMISSION_GRANTED) {
            call.reject("Termux RUN_COMMAND permission is missing. Grant it in Android Settings → Apps → Nocturne → Permissions → Additional permissions, and set allow-external-apps = true in ~/.termux/termux.properties.");
            return;
        }

        Intent intent = new Intent("com.termux.RUN_COMMAND");
        intent.setComponent(new ComponentName(TERMUX_PACKAGE, "com.termux.app.RunCommandService"));
        intent.putExtra("com.termux.RUN_COMMAND_PATH", SCRIPT_PATH);
        intent.putExtra("com.termux.RUN_COMMAND_ARGUMENTS", new String[]{action});
        intent.putExtra("com.termux.RUN_COMMAND_WORKDIR", "/data/data/com.termux/files/home");
        intent.putExtra("com.termux.RUN_COMMAND_BACKGROUND", true);
        try {
            getContext().startService(intent);
            JSObject result = new JSObject();
            result.put("accepted", true);
            result.put("action", action);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not send command to Termux: " + error.getMessage());
        }
    }
}
