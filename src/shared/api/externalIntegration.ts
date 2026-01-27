/**
 * External Integration Service
 *
 * Manages connections to external school systems:
 * - Somtoday (real implementation)
 * - Magister (stub)
 * - Zermelo (stub)
 */

import { SomtodayAfspraak } from "@shared/types/somtodayTypes";
import { useCallback, useEffect, useState } from "react";

import { somtodayService } from "./somtodayService";

export interface ExternalSource {
  id: string;
  name: "Magister" | "Zermelo" | "Somtoday";
  status: "connected" | "disconnected" | "connecting" | "error";
  lastSync?: string;
  studentName?: string;
  schoolName?: string;
}

export const useExternalIntegration = () => {
  const [sources, setSources] = useState<ExternalSource[]>(() => {
    // Check Somtoday connection status on init
    const somtodayStatus = somtodayService.getStatus();

    return [
      { id: "1", name: "Magister", status: "disconnected" },
      { id: "2", name: "Zermelo", status: "disconnected" },
      {
        id: "3",
        name: "Somtoday",
        status: somtodayStatus.connected ? "connected" : "disconnected",
        ...(somtodayStatus.lastSync
          ? { lastSync: somtodayStatus.lastSync }
          : {}),
        ...(somtodayStatus.student
          ? {
              studentName: `${somtodayStatus.student.roepnaam} ${somtodayStatus.student.achternaam}`,
            }
          : {}),
        ...(somtodayStatus.school?.naam
          ? { schoolName: somtodayStatus.school.naam }
          : {}),
      },
    ];
  });

  // Update Somtoday status when it changes
  useEffect(() => {
    const checkSomtodayStatus = () => {
      const status = somtodayService.getStatus();
      setSources((prev) =>
        prev.map(
          (s): ExternalSource =>
            s.name === "Somtoday"
              ? {
                  ...s,
                  status: status.connected ? "connected" : "disconnected",
                  ...(status.lastSync ? { lastSync: status.lastSync } : {}),
                  ...(status.student
                    ? {
                        studentName: `${status.student.roepnaam} ${status.student.achternaam}`,
                      }
                    : {}),
                  ...(status.school?.naam
                    ? { schoolName: status.school.naam }
                    : {}),
                }
              : s,
        ),
      );
    };

    // Check periodically (for OAuth callback updates)
    const interval = setInterval(checkSomtodayStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Connect to an external source
   * Note: Somtoday uses a different flow (SchoolSearchModal)
   */
  const connect = useCallback(
    async (sourceName: ExternalSource["name"]): Promise<boolean> => {
      console.log(`[Integration] Connecting to ${sourceName}...`);

      // For Magister/Zermelo - still using stub
      if (sourceName !== "Somtoday") {
        return new Promise<boolean>((resolve) => {
          setSources((prev) =>
            prev.map((s) =>
              s.name === sourceName ? { ...s, status: "connecting" } : s,
            ),
          );

          setTimeout(() => {
            const success = Math.random() > 0.1;

            if (success) {
              setSources((prev) =>
                prev.map((s) =>
                  s.name === sourceName
                    ? {
                        ...s,
                        status: "connected",
                        lastSync: new Date().toISOString(),
                      }
                    : s,
                ),
              );
            } else {
              setSources((prev) =>
                prev.map((s) =>
                  s.name === sourceName ? { ...s, status: "error" } : s,
                ),
              );
            }

            resolve(success);
          }, 1000);
        });
      }

      // Somtoday - handled via SchoolSearchModal
      // This function shouldn't be called directly for Somtoday
      return false;
    },
    [],
  );

  /**
   * Mark Somtoday as connected (called after OAuth success)
   */
  const markSomtodayConnected = useCallback(() => {
    const status = somtodayService.getStatus();
    setSources((prev) =>
      prev.map((s) =>
        s.name === "Somtoday"
          ? {
              ...s,
              status: "connected",
              lastSync: status.lastSync || new Date().toISOString(),
              ...(status.student
                ? {
                    studentName: `${status.student.roepnaam} ${status.student.achternaam}`,
                  }
                : {}),
              ...(status.school?.naam
                ? { schoolName: status.school.naam }
                : {}),
            }
          : s,
      ),
    );
  }, []);

  /**
   * Disconnect from an external source
   */
  const disconnect = useCallback((sourceName: ExternalSource["name"]) => {
    if (sourceName === "Somtoday") {
      somtodayService.disconnect();
    }

    setSources((prev) =>
      prev.map((s) =>
        s.name === sourceName
          ? {
              ...s,
              status: "disconnected",
              lastSync: undefined as unknown as string, // Force reset (or simply omit in a clean object re-creation)
              studentName: undefined as unknown as string,
              schoolName: undefined as unknown as string,
            }
          : s,
      ),
    );
  }, []);

  /**
   * Sync schedule from Somtoday
   */
  const syncSomtodaySchedule = useCallback(async (): Promise<
    SomtodayAfspraak[]
  > => {
    if (!somtodayService.isConnected()) {
      throw new Error("Somtoday not connected");
    }

    // Get schedule for past week + next 4 weeks to avoid clearing current week history
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7); // Go back 7 days

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 28);

    const startStr = startDate.toISOString().split("T")[0]!;
    const endStr = endDate.toISOString().split("T")[0]!;

    console.log(`[Somtoday] Fetching schedule from ${startStr} to ${endStr}`);

    const schedule = await somtodayService.getSchedule(startStr, endStr);

    if (!schedule) {
      console.warn("[Somtoday] API returned null schedule (error occurred)");
      return [];
    }

    console.log(`[Somtoday] API returned ${schedule.length} appointments`);
    if (schedule.length > 0) {
      console.log(
        "[Somtoday] First 3 appointments:",
        schedule.slice(0, 3).map((a) => ({
          titel: a.titel,
          beginDatumTijd: a.beginDatumTijd,
        })),
      );
    }

    // Update last sync time
    setSources((prev) =>
      prev.map((s) =>
        s.name === "Somtoday"
          ? { ...s, lastSync: new Date().toISOString() }
          : s,
      ),
    );

    return schedule;
  }, []);

  return {
    sources,
    connect,
    disconnect,
    markSomtodayConnected,
    syncSomtodaySchedule,
  };
};
