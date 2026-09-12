import { UserCircle2 } from "lucide-react";

export default function Topbar({ title, subtitle, name, actions }) {
  return (
    <div className="flex items-center justify-between mb-7 gap-4 flex-wrap">
      <div>
        {title && <h1 className="text-2xl font-semibold text-navy-900">{title}</h1>}
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        {name && (
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-full pl-2 pr-4 py-1.5 shadow-sm">
            <UserCircle2 className="text-brand" size={28} strokeWidth={1.5} />
            <span className="text-sm font-medium text-navy-900">{name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
