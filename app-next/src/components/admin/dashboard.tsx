import { logoutAdminAction, updateThemeTokenAction, upsertVideoAction } from "@/lib/admin-actions";
import type { ThemeToken, YoutubeVideo } from "@/types/cms";

export function AdminDashboard({
  tokensLight,
  tokensDark,
  videos,
}: {
  tokensLight: ThemeToken[];
  tokensDark: ThemeToken[];
  videos: YoutubeVideo[];
}) {
  return (
    <div className="admin-stack">
      <section className="card admin-card">
        <div className="admin-head">
          <h2>Theme Tokens</h2>
          <form action={logoutAdminAction}>
            <button className="btn secondary" type="submit">Logout</button>
          </form>
        </div>

        <div className="token-grid">
          {[...tokensLight, ...tokensDark].map((token) => (
            <form key={token.id} action={updateThemeTokenAction} className="token-form">
              <input type="hidden" name="mode" value={token.mode} />
              <input type="hidden" name="tokenKey" value={token.token_key} />
              <label>
                <span>{token.mode}.{token.token_key}</span>
                <input name="tokenValue" defaultValue={token.token_value} />
              </label>
              <button className="btn primary" type="submit">Save</button>
            </form>
          ))}
        </div>
      </section>

      <section className="card admin-card">
        <h2>YouTube Videos</h2>
        <div className="token-grid">
          {videos.map((video) => (
            <form key={video.id} action={upsertVideoAction} className="token-form">
              <input type="hidden" name="id" defaultValue={video.id} />
              <label>
                <span>YouTube ID</span>
                <input name="youtube_id" defaultValue={video.youtube_id} />
              </label>
              <label>
                <span>Title AR</span>
                <input name="title_ar" defaultValue={video.title_ar} />
              </label>
              <label>
                <span>Title EN</span>
                <input name="title_en" defaultValue={video.title_en} />
              </label>
              <label>
                <span>Description AR</span>
                <textarea name="description_ar" defaultValue={video.description_ar} rows={2} />
              </label>
              <label>
                <span>Description EN</span>
                <textarea name="description_en" defaultValue={video.description_en} rows={2} />
              </label>
              <label>
                <span>Thumbnail URL</span>
                <input name="thumbnail" defaultValue={video.thumbnail} />
              </label>
              <label>
                <span>Duration</span>
                <input name="duration" defaultValue={video.duration} />
              </label>
              <label>
                <span>Views</span>
                <input name="views" type="number" defaultValue={video.views} />
              </label>
              <label>
                <span>Published At</span>
                <input name="published_at" defaultValue={video.published_at} />
              </label>
              <label>
                <span>Sort Order</span>
                <input name="sort_order" type="number" defaultValue={video.sort_order} />
              </label>
              <label className="check-row">
                <input name="is_featured" type="checkbox" defaultChecked={video.is_featured} />
                Featured
              </label>
              <label className="check-row">
                <input name="is_active" type="checkbox" defaultChecked={video.is_active} />
                Active
              </label>
              <button className="btn primary" type="submit">Save Video</button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
