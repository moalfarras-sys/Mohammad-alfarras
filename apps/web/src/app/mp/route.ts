import { shortLinkHandler } from "@/lib/latest-apk-download";
import { appTvInstall } from "@moalfarras/shared/app-releases";

// https://moalfarras.space/mp — permanent, remote-typeable link to the latest
// MoPlayer Classic universal APK (product `moplayer`). Downloader codes point
// here, so it must keep working for every future release.
export const dynamic = "force-dynamic";

const handler = shortLinkHandler("moplayer", appTvInstall.moplayer.shortPath);

export const GET = handler;
export const HEAD = handler;
