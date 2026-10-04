import { shortLinkHandler } from "@/lib/latest-apk-download";
import { appTvInstall } from "@moalfarras/shared/app-releases";

// https://moalfarras.space/mp2 — permanent, remote-typeable link to the latest
// MoPlayer Pro APK (product `moplayer2`). Downloader codes point here, so it
// must keep working for every future release.
export const dynamic = "force-dynamic";

const handler = shortLinkHandler("moplayer2", appTvInstall.moplayer2.shortPath);

export const GET = handler;
export const HEAD = handler;
