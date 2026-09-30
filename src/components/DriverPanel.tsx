"use client";

import type { ApplyResult, DriverId, DriverInfo } from "@/lib/client-types";

/** Lists the available light outputs and lets the user switch between them. */
export function DriverPanel({
  active,
  drivers,
  lastApply,
  onSelect,
}: {
  active: DriverInfo;
  drivers: DriverInfo[];
  lastApply: ApplyResult | null;
  onSelect: (id: DriverId) => Promise<void>;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="label">Light output</div>
        {lastApply && (
          <span className={`text-xs ${lastApply.ok ? "text-emerald-300" : "text-red-300"}`}>
            {lastApply.ok ? `Applied in ${lastApply.latencyMs} ms` : `Failed: ${lastApply.error}`}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {drivers.map((driver) => {
          const isActive = driver.id === active.id;
          return (
            <button
              key={driver.id}
              onClick={() => onSelect(driver.id)}
              disabled={!driver.ready || isActive}
              className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-left transition ${
                isActive ? "border-white/40 bg-white/10" : "border-white/10 bg-black/20 hover:bg-white/5"
              } disabled:cursor-default disabled:opacity-70`}
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className={`h-2 w-2 rounded-full ${driver.ready ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  {driver.name}
                  {isActive && <span className="chip">active</span>}
                </div>
                <div className="mt-0.5 text-xs text-zinc-400">{driver.description}</div>
                {driver.detail && <div className="mt-0.5 text-[11px] text-zinc-500">{driver.detail}</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
