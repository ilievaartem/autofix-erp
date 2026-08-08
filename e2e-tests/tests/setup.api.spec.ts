import { expect, test } from "@playwright/test";

test("provides an API request context without launching a browser", async ({
  request,
}) => {
  expect(request).toBeDefined();
});
