import { NavLink } from "react-router-dom";
import { navItems } from "./navItems";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background md:hidden">
      <div className="grid grid-cols-4 h-16">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex flex-col items-center justify-center gap-0.5 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={[
                    "flex items-center justify-center rounded-2xl w-14 py-1 transition-all",
                    isActive ? "bg-primary/15" : "",
                  ].join(" ")}
                >
                  <Icon className={["h-5 w-5 transition-transform", isActive ? "scale-110" : ""].join(" ")} />
                </div>
                <span className={isActive ? "font-semibold" : ""}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
