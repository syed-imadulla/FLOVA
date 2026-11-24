package in.flova.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

/**
 * Native Android AppWidgetProvider for the 1:2 Compact Voice Microphone widget.
 * Deep links directly to in.flova.app://voice?autoRecord=true.
 */
public class FlovaMicWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_compact_mic);

        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("in.flova.app://voice?autoRecord=true"));
        intent.setPackage(context.getPackageName());
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            1001,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        views.setOnClickPendingIntent(R.id.widget_compact_mic_root, pendingIntent);
        views.setOnClickPendingIntent(R.id.btn_widget_mic_action, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
