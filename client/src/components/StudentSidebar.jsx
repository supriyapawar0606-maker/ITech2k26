import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, ListChecks, Trophy, UserCircle, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/quizzes", label: "Quiz Information", icon: FileText },
  { to: "/instructions", label: "Instructions", icon: ListChecks },
  { to: "/attempts", label: "My Result", icon: Trophy },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

const linkClass = ({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`;

export default function StudentSidebar() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile/tablet top bar */}
      <div className="lg:hidden flex items-center justify-between bg-navy-950 px-4 py-3 sticky top-0 z-30">
        <Logo dark />
        <button onClick={() => setOpen(true)} className="text-slate-300 hover:text-white p-1">
          <Menu size={22} />
        </button>
      </div>

      {/* Backdrop (mobile/tablet only) */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`w-64 bg-navy-950 flex flex-col py-6 px-4 shrink-0 fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out
        lg:static lg:translate-x-0 lg:z-auto lg:min-h-screen
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-1 mb-9">
          <Logo dark />
          <button onClick={() => setOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={() => setOpen(false)}>
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="sidebar-link mt-2 text-slate-400 hover:text-white">
          <LogOut size={18} />
          Logout
        </button>
      </aside>
    </>
  );
}
