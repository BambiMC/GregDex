import { readFileSync } from "fs";
import { join } from "path";
import MachineDetailClient from "@/components/pages/MachineDetailClient";

export const dynamicParams = false;

export function generateStaticParams() {
  try {
    const machines = JSON.parse(
      readFileSync(join(process.cwd(), "data", "machines.json"), "utf8"),
    );
    return machines.map((m: { id: string }) => ({ machineId: m.id }));
  } catch {
    return [{ machineId: "_" }];
  }
}

export default function Page({
  params,
}: {
  params: Promise<{ machineId: string }>;
}) {
  return <MachineDetailClient params={params} />;
}
