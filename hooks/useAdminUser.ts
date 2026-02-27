"use client";

import { useMemo } from "react";

import type { PortalUser } from "@/lib/types";

export const useAdminUser = (user: PortalUser | null) =>
  useMemo(
    () => ({
      user,
      isAdmin: Boolean(user?.isAdmin),
      email: user?.email ?? "",
    }),
    [user],
  );
