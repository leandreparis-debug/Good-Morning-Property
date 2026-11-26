/**
 * Fake clocks of the e2e servers. Open states use the far future and the closed state the
 * past, so that the database (which uses the real `now()` for the RLS) agrees with the app.
 */
export const CLOCKS = {
  /** Real time. */
  chromium: {
    port: 3000,
    fakeNow: undefined,
    testMatch: /^(?!.*\.(open|soon|closed)\.spec\.ts$).*\.spec\.ts$/,
  },
  /** Wednesday 07/01/2099 11:00 Paris: entry open for Monday 12/01/2099. */
  open: { port: 3001, fakeNow: "2099-01-07T10:00:00Z", testMatch: /\.open\.spec\.ts$/ },
  /** Monday 12/01/2099 07:45 Paris: entry closes in 2 h 15. */
  soon: { port: 3002, fakeNow: "2099-01-12T06:45:00Z", testMatch: /\.soon\.spec\.ts$/ },
  /** Monday 06/01/2020 11:00 Paris: meeting day, entry closed. */
  closed: { port: 3003, fakeNow: "2020-01-06T10:00:00Z", testMatch: /\.closed\.spec\.ts$/ },
} as const;

/** Meeting dates matching the fake clocks. */
export const OPEN_MEETING = "2099-01-12";
export const CLOSED_MEETING = "2020-01-06";
