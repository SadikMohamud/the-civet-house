import Image from "next/image";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { menu } from "@/lib/menu";
import type { Role } from "@/lib/types";

function price(p: number) {
  return `£${p.toFixed(2)}`;
}

export default function MenuView({ role }: { role: Role }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pb-28 pt-8">
      <header className="flex items-center justify-between">
        <div>
          <Logo className="h-9 w-auto" priority />
          <p className="mt-1 text-xs text-brand-muted">Menu</p>
        </div>
        <Link
          href="/account"
          className="text-sm text-brand-muted underline underline-offset-2 hover:text-brand"
        >
          Account
        </Link>
      </header>

      {menu.map((category) => (
        <section key={category.name} className="animate-rise">
          <div className="relative mb-3 h-28 overflow-hidden rounded-3xl shadow-sm">
            {category.image && (
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 480px) 100vw, 448px"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
            <h2 className="absolute bottom-3 left-4 text-lg font-semibold text-white">
              {category.name}
            </h2>
          </div>

          <ul className="overflow-hidden rounded-3xl bg-brand-surface shadow-sm">
            {category.items.map((item, i) => (
              <li
                key={item.name}
                className={`flex items-start justify-between gap-4 px-5 py-4 ${
                  i > 0 ? "border-t border-brand-accent/15" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.name}</p>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-brand-muted">
                      {item.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-medium text-brand">
                  {price(item.price)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="text-center text-xs text-brand-muted">
        Prices include VAT. Ask a barista about allergens.
      </p>

      <BottomNav role={role} />
    </div>
  );
}
