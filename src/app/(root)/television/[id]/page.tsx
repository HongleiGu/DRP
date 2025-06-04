/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import dynamic from "next/dynamic";

const Television = dynamic(() => import("./Television"), {
  ssr: false, // Disable server-side rendering for this component
});

export default function LazyLoadedTelevision() {
  return <Television />;
}