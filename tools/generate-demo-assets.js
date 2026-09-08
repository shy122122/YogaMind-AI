const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const outputDirs = [
  path.join(projectRoot, "outputs", "assets", "demo"),
  path.join(projectRoot, "mobile-preview", "assets", "demo"),
];

const poses = [
  {
    key: "standing_breath",
    title: "站姿呼吸",
    tip: "肩膀自然下沉",
    head: [450, 205, 46],
    torso: "M450 272 C438 382 438 492 450 606",
    arms: ["M410 340 C352 420 328 510 318 614", "M490 340 C548 420 572 510 582 614"],
    legs: ["M450 606 L398 792", "M450 606 L502 792"],
    mat: "M276 822 C390 786 510 786 624 822",
  },
  {
    key: "cat_cow",
    title: "猫牛式",
    tip: "跟随呼吸卷动脊柱",
    head: [650, 430, 42],
    torso: "M250 540 C370 422 518 418 650 538",
    arms: ["M306 530 L264 724", "M608 536 L662 724"],
    legs: ["M388 468 L356 724", "M512 472 L500 724"],
    mat: "M208 770 C374 740 540 740 706 770",
  },
  {
    key: "child_pose",
    title: "婴儿式",
    tip: "背部柔和拉长",
    head: [674, 626, 40],
    torso: "M244 650 C380 534 532 552 672 626",
    arms: ["M542 618 C642 666 728 662 792 632", "M512 650 C620 706 706 710 778 680"],
    legs: ["M260 654 C284 746 406 770 526 722", "M338 674 C430 714 526 700 600 648"],
    mat: "M188 806 C366 778 548 778 726 806",
  },
  {
    key: "mountain",
    title: "山式站立",
    tip: "脚掌踩稳向上延展",
    head: [450, 190, 46],
    torso: "M450 258 C450 382 450 500 450 628",
    arms: ["M406 332 C358 430 334 532 326 640", "M494 332 C542 430 566 532 574 640"],
    legs: ["M450 628 L394 812", "M450 628 L506 812"],
    mat: "M292 840 C398 808 502 808 608 840",
  },
  {
    key: "seated_neck",
    title: "坐姿颈侧放松",
    tip: "先沉肩再轻拉",
    head: [520, 280, 46],
    torso: "M448 378 C428 486 432 574 456 652",
    arms: ["M420 438 C354 480 314 528 286 592", "M476 438 C542 482 582 532 610 594"],
    legs: ["M456 652 C348 704 292 748 230 790", "M456 652 C570 704 646 748 710 790"],
    mat: "M198 830 C360 786 540 786 702 830",
  },
  {
    key: "side_bend",
    title: "站姿侧伸展",
    tip: "侧腰向上拉长",
    head: [540, 242, 45],
    torso: "M474 320 C530 430 538 538 502 650",
    arms: ["M470 354 C404 298 358 236 334 170", "M494 360 C572 360 626 398 666 456"],
    legs: ["M502 650 L414 820", "M502 650 L568 820"],
    mat: "M280 850 C400 812 522 812 642 850",
  },
  {
    key: "half_forward_fold",
    title: "半前屈伸展",
    tip: "背部拉长膝盖微屈",
    head: [690, 548, 41],
    torso: "M438 334 C520 412 606 486 690 548",
    arms: ["M514 420 C626 442 706 476 770 524", "M500 452 C594 498 652 552 704 620"],
    legs: ["M438 334 L386 820", "M438 334 L486 820"],
    mat: "M278 848 C428 810 578 810 728 848",
  },
  {
    key: "low_lunge",
    title: "低弓步",
    tip: "前膝对准脚尖",
    head: [458, 238, 44],
    torso: "M456 306 C462 418 458 516 444 600",
    arms: ["M456 366 C352 410 286 466 230 546", "M456 366 C552 398 636 454 704 538"],
    legs: ["M444 600 C548 618 646 656 750 748", "M444 600 C354 676 276 724 180 762"],
    mat: "M150 802 C340 760 554 760 770 802",
  },
  {
    key: "bridge",
    title: "桥式预备",
    tip: "骨盆稳定胸口打开",
    head: [252, 646, 42],
    torso: "M252 646 C392 512 544 510 684 650",
    arms: ["M250 710 C360 738 506 738 680 708"],
    legs: ["M352 580 L304 774", "M606 584 L678 774"],
    mat: "M194 812 C362 774 532 774 700 812",
  },
  {
    key: "supine_twist",
    title: "仰卧扭转",
    tip: "肩膀尽量贴地",
    head: [248, 596, 42],
    torso: "M248 596 C386 560 520 562 650 604",
    arms: ["M330 596 L250 760", "M448 576 L478 760"],
    legs: ["M370 570 C448 496 530 470 632 478", "M374 610 C478 690 570 724 720 710"],
    mat: "M180 804 C366 766 548 766 734 804",
  },
];

function limbs(paths) {
  return paths.map((d) => `<path d="${d}" />`).join("");
}

function svgForPose(pose) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100" role="img" aria-label="${pose.title}真人示范图">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.56" stop-color="#F8FBFF"/>
      <stop offset="1" stop-color="#EAF8F7"/>
    </linearGradient>
    <linearGradient id="wear" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#6AC4BE"/>
      <stop offset="1" stop-color="#5368D8"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#5368D8" flood-opacity=".14"/>
    </filter>
  </defs>
  <rect width="900" height="1100" rx="0" fill="url(#bg)"/>
  <path d="M172 178 C238 120 330 104 404 140 C516 194 614 102 728 168 C824 224 808 362 752 420 C666 510 744 636 650 734 C560 828 432 780 342 824 C238 874 130 796 150 680 C168 574 96 494 128 386 C152 300 106 242 172 178Z" fill="#DCE6F8" opacity=".38"/>
  <path d="${pose.mat}" fill="none" stroke="#6AC4BE" stroke-width="34" stroke-linecap="round" opacity=".22"/>
  <g filter="url(#shadow)">
    <g fill="none" stroke="#F6B99B" stroke-width="50" stroke-linecap="round" stroke-linejoin="round">${limbs(pose.legs)}</g>
    <g fill="none" stroke="#F6B99B" stroke-width="44" stroke-linecap="round" stroke-linejoin="round">${limbs(pose.arms)}</g>
    <path d="${pose.torso}" fill="none" stroke="url(#wear)" stroke-width="72" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${pose.head[0]}" cy="${pose.head[1]}" r="${pose.head[2]}" fill="#F6B99B"/>
    <path d="M${pose.head[0] - pose.head[2] * 0.45} ${pose.head[1] - pose.head[2] * 0.44} C${pose.head[0] - pose.head[2] * 0.1} ${pose.head[1] - pose.head[2] * 0.82} ${pose.head[0] + pose.head[2] * 0.54} ${pose.head[1] - pose.head[2] * 0.46} ${pose.head[0] + pose.head[2] * 0.42} ${pose.head[1] + pose.head[2] * 0.12}" fill="none" stroke="#27324A" stroke-width="14" stroke-linecap="round" opacity=".32"/>
  </g>
  <g fill="#FFFFFF" stroke="#6AC4BE" stroke-width="6" opacity=".88">
    <circle cx="${pose.head[0]}" cy="${pose.head[1] + pose.head[2] + 34}" r="12"/>
  </g>
  <rect x="96" y="86" width="300" height="74" rx="37" fill="#FFFFFF" opacity=".9"/>
  <text x="246" y="132" text-anchor="middle" font-size="29" font-weight="700" font-family="PingFang SC, Microsoft YaHei, sans-serif" fill="#27324A">${pose.title}</text>
  <rect x="96" y="910" width="708" height="104" rx="34" fill="#FFFFFF" opacity=".9"/>
  <text x="450" y="966" text-anchor="middle" font-size="34" font-weight="700" font-family="PingFang SC, Microsoft YaHei, sans-serif" fill="#5368D8">${pose.tip}</text>
</svg>
`;
}

for (const dir of outputDirs) {
  fs.mkdirSync(dir, { recursive: true });
  for (const pose of poses) {
    fs.writeFileSync(path.join(dir, `${pose.key}.svg`), svgForPose(pose), "utf8");
  }
}

console.log(`Generated ${poses.length} demo assets in ${outputDirs.length} locations.`);
