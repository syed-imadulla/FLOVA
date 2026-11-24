package in.flova.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.ArrayMap;
import android.util.SizeF;
import android.widget.RemoteViews;

import java.util.Map;

/**
 * Native Android AppWidgetProvider for the Extended Quick-Actions widget.
 * Supports:
 * - Default 2x2 footprint (2 columns x 2 rows)
 * - Expanded 4x2 footprint (4 columns x 2 rows)
 * Deep links to Voice, Add, Receipt, and History.
 */
public class FlovaQuickActionsWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);
        updateWidget(context, appWidgetManager, appWidgetId);
    }

    private static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views2x2 = createQuickActionViews(context, R.layout.widget_extended_quick_actions);
        RemoteViews views4x2 = createQuickActionViews(context, R.layout.widget_quick_actions_4x2);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12+ responsive RemoteViews layout mapping
            Map<SizeF, RemoteViews> viewMapping = new ArrayMap<>();
            viewMapping.put(new SizeF(110f, 110f), views2x2);
            viewMapping.put(new SizeF(230f, 110f), views4x2);
            RemoteViews responsiveViews = new RemoteViews(viewMapping);
            appWidgetManager.updateAppWidget(appWidgetId, responsiveViews);
        } else {
            // Android < 12 size-aware fallback using widget options
            Bundle options = appWidgetManager.getAppWidgetOptions(appWidgetId);
            int minWidth = options != null ? options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0) : 0;
            RemoteViews views = (minWidth >= 220) ? views4x2 : views2x2;
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }

    private static RemoteViews createQuickActionViews(Context context, int layoutId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), layoutId);

        // 1. Voice Action -> in.flova.app://voice?autoRecord=true
        Intent voiceIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("in.flova.app://voice?autoRecord=true"));
        voiceIntent.setPackage(context.getPackageName());
        voiceIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent voicePending = PendingIntent.getActivity(
            context, 2001, voiceIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.btn_action_voice, voicePending);

        // 2. Add Action -> in.flova.app://add
        Intent addIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("in.flova.app://add"));
        addIntent.setPackage(context.getPackageName());
        addIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent addPending = PendingIntent.getActivity(
            context, 2002, addIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.btn_action_add, addPending);

        // 3. Receipt Action -> in.flova.app://catch
        Intent receiptIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("in.flova.app://catch"));
        receiptIntent.setPackage(context.getPackageName());
        receiptIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent receiptPending = PendingIntent.getActivity(
            context, 2003, receiptIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.btn_action_receipt, receiptPending);

        // 4. History Action -> in.flova.app://activity
        Intent historyIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("in.flova.app://activity"));
        historyIntent.setPackage(context.getPackageName());
        historyIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent historyPending = PendingIntent.getActivity(
            context, 2004, historyIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.btn_action_history, historyPending);

        return views;
    }
}
