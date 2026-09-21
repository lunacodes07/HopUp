import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonicalTestimonialHandle,
  uniqueTestimonialHandles,
  xAvatarPath,
} from "./testimonials.ts";
import { parseXDisplayNames, parseXProfiles, upgradeTwimgAvatar } from "./x-profile.ts";

test("only known testimonial handles resolve", () => {
  assert.equal(canonicalTestimonialHandle("The_CozyDev"), "The_CozyDev");
  assert.equal(canonicalTestimonialHandle("@ksparth12"), "Ksparth12");
  assert.equal(canonicalTestimonialHandle("not_a_real_user"), null);
  assert.equal(canonicalTestimonialHandle("../etc/passwd"), null);
  assert.ok(uniqueTestimonialHandles().includes("ZenModeJon"));
});

test("avatar path stays on our cached route", () => {
  assert.equal(xAvatarPath("The_CozyDev"), "/api/x-avatar?h=The_CozyDev");
});

test("parses X widget display names and avatars", () => {
  assert.equal(
    upgradeTwimgAvatar("https://pbs.twimg.com/profile_images/1/abc_normal.jpg"),
    "https://pbs.twimg.com/profile_images/1/abc_400x400.jpg"
  );

  const names = parseXDisplayNames([
    { screen_name: "The_CozyDev", name: "The Cozy Dev" },
    { screen_name: "Ksparth12", name: "  Parth Sharma " },
    { screen_name: 12, name: "nope" },
  ]);
  assert.equal(names.the_cozydev, "The Cozy Dev");
  assert.equal(names.ksparth12, "Parth Sharma");
  assert.equal(names["12"], undefined);

  const profiles = parseXProfiles([
    {
      screen_name: "ZenModeJon",
      name: "Jonathan Lis",
      profile_image_url_https: "https://pbs.twimg.com/profile_images/1/abc_normal.jpg",
    },
  ]);
  assert.equal(profiles.zenmodejon.name, "Jonathan Lis");
  assert.match(profiles.zenmodejon.avatarUrl, /_400x400\.jpg$/);
});
