"use client";

import { usePathname } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const navigation = [
  { href: "/admin/dashboard", label: "📊 Dashboard" },
  { href: "/admin/basvurular", label: "📥 İşletme Başvuruları" },
  { href: "/admin/isletmeler", label: "🏢 İşletmeler" },
  { href: "/admin/yeni-isletme", label: "➕ Yeni İşletme" },
  { href: "/admin/one-cikanlar", label: "⭐ Öne Çıkanlar" },
  { href: "/admin/ayarlar", label: "⚙ Ayarlar" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/admin";
  }

  return (
    <aside className="admin-sidebar">
      <div>
        <a href="/" className="admin-brand">
          Önce<span>Bak</span>
        </a>

        <p className="admin-panel-label">Yönetim Paneli</p>

        <nav className="admin-navigation">
          {navigation.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" &&
                pathname.startsWith(`${item.href}/`));

            return (
              <a
                key={item.href}
                href={item.href}
                className={active ? "active" : ""}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>

      <div className="admin-sidebar-bottom">
        <a href="/" className="admin-site-link">
          Ana siteyi görüntüle →
        </a>

        <button type="button" onClick={handleLogout}>
          Çıkış Yap
        </button>
      </div>

      <style jsx>{`
        .admin-sidebar {
          position: sticky;
          top: 0;
          min-height: 100vh;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 32px 24px;
          background: #171717;
          color: #fff;
        }

        .admin-brand {
          color: #fff;
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -1.2px;
          text-decoration: none;
        }

        .admin-brand span {
          color: #ff5a1f;
        }

        .admin-panel-label {
          margin: 8px 0 0;
          color: #a3a3a3;
          font-size: 13px;
        }

        .admin-navigation {
          display: grid;
          gap: 10px;
          margin-top: 42px;
        }

        .admin-navigation a {
          padding: 14px 16px;
          border-radius: 12px;
          color: #d4d4d4;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .admin-navigation a:hover {
          background: #242424;
          color: #fff;
        }

        .admin-navigation a.active {
          background: #ff5a1f;
          color: #fff;
          font-weight: 800;
        }

        .admin-sidebar-bottom {
          display: grid;
          gap: 12px;
        }

        .admin-site-link {
          color: #a3a3a3;
          font-size: 13px;
          text-decoration: none;
        }

        .admin-sidebar-bottom button {
          width: 100%;
          padding: 12px 18px;
          border: 1px solid #393939;
          border-radius: 12px;
          background: #242424;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }

        @media (max-width: 980px) {
          .admin-sidebar {
            position: static;
            width: 100%;
            min-height: auto;
            height: auto;
            padding: 18px 20px;
          }

          .admin-navigation {
            display: flex;
            overflow-x: auto;
            margin-top: 18px;
            padding-bottom: 4px;
          }

          .admin-navigation a {
            flex: none;
          }

          .admin-sidebar-bottom {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}
