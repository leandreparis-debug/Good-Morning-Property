"use client";

import type { MeetingState } from "@/lib/meetingState";
import type { MeetingRoomProps } from "./MeetingRoom";

/** Speaking turns, timer and visits round — phase H. */
export function SpeakingTurns(
  _props: MeetingRoomProps & {
    state: MeetingState;
    update: (change: (current: MeetingState) => MeetingState) => void;
  },
) {
  return null;
}
