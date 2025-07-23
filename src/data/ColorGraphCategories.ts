import type { SunburstData } from "@/types/Filter";

export const ColorGraphCategories: SunburstData = {
  name: "무신사 스탠다드",
  children: [
    {
      name: "BLACK",
      value: 22.4,
      color: "#202022",
      children: [ 
        { name: "#202022", color: "#202022", value: 22.4 / 11 },
        { name: "#282d30", color: "#282d30", value: 22.4 / 11 },
        { name: "#101010", color: "#101010", value: 22.4 / 11 },
        { name: "#10181a", color: "#10181a", value: 22.4 / 11 },
        { name: "#343338", color: "#343338", value: 22.4 / 11 },
        { name: "#1b1c1e", color: "#1b1c1e", value: 22.4 / 11 },
        { name: "#0d0d0d", color: "#0d0d0d", value: 22.4 / 11 },
        { name: "#1c1d21", color: "#1c1d21", value: 22.4 / 11 },
        { name: "#252429", color: "#252429", value: 22.4 / 11 },
        { name: "#191919", color: "#191919", value: 22.4 / 11 },
        { name: "#0a0b0d", color: "#0a0b0d", value: 22.4 / 11 },
      ],
    },
    {
      name: "BLUE",
      value: 12.2,
      color: "#161c2a",
      children: [
        { name: "#161c2a", color: "#161c2a", value: 12.2 / 6 },
        { name: "#9ba7b3", color: "#9ba7b3", value: 12.2 / 6 },
        { name: "#c8c7cc", color: "#c8c7cc", value: 12.2 / 6 },
        { name: "#6a747d", color: "#6a747d", value: 12.2 / 6 },
        { name: "#4b6281", color: "#4b6281", value: 12.2 / 6 },
        { name: "#88959e", color: "#88959e", value: 12.2 / 6 },
      ],
    },
    {
      name: "BROWN",
      value: 6.1,
      color: "#2f1d13",
      children: [
        { name: "#2f1d13", color: "#2f1d13", value: 6.1 / 3 },
        { name: "#b5a898", color: "#b5a898", value: 6.1 / 3 },
        { name: "#342b2c", color: "#342b2c", value: 6.1 / 3 },
      ],
    },
    {
      name: "GRAY",
      value: 22.4,
      color: "#a8a7a2",
      children: [
        { name: "#a8a7a2", color: "#a8a7a2", value: 22.4 / 11 },
        { name: "#adadab", color: "#adadab", value: 22.4 / 11 },
        { name: "#71706e", color: "#71706e", value: 22.4 / 11 },
        { name: "#201f25", color: "#201f25", value: 22.4 / 11 },
        { name: "#3e3e46", color: "#3e3e46", value: 22.4 / 11 },
        { name: "#464648", color: "#464648", value: 22.4 / 11 },
        { name: "#c6c7cb", color: "#c6c7cb", value: 22.4 / 11 },
        { name: "#b1b1b1", color: "#b1b1b1", value: 22.4 / 11 },
        { name: "#aea6a3", color: "#aea6a3", value: 22.4 / 11 },
        { name: "#28373c", color: "#28373c", value: 22.4 / 11 },
        { name: "#26272c", color: "#26272c", value: 22.4 / 11 },
      ],
    },
    {
      name: "GREEN",
      value: 4.1,
      color: "#0eab8c",
      children: [
        { name: "#0eab8c", color: "#0eab8c", value: 4.1 / 2 },
        { name: "#8f948d", color: "#8f948d", value: 4.1 / 2 },
      ],
    },
    {
      name: "PINK",
      value: 4.1,
      color: "#edced3",
      children: [
        { name: "#edced3", color: "#edced3", value: 4.1 / 2 },
        { name: "#dcc8c9", color: "#dcc8c9", value: 4.1 / 2 },
      ],
    },
    {
      name: "RED",
      value: 6.1,
      color: "#fb2d37",
      children: [
        { name: "#fb2d37", color: "#fb2d37", value: 6.1 / 3 },
        { name: "#b03643", color: "#b03643", value: 6.1 / 3 },
        { name: "#c62e3b", color: "#c62e3b", value: 6.1 / 3 },
      ],
    },
    {
      name: "WHITE",
      value: 16.3,
      color: "#eaeae8",
      children: [
        { name: "#eaeae8", color: "#eaeae8", value: 16.3 / 8 },
        { name: "#dfdbd8", color: "#dfdbd8", value: 16.3 / 8 },
        { name: "#ebecf1", color: "#ebecf1", value: 16.3 / 8 },
        { name: "#c7c0b8", color: "#c7c0b8", value: 16.3 / 8 },
        { name: "#e3e1e6", color: "#e3e1e6", value: 16.3 / 8 },
        { name: "#d7d6d1", color: "#d7d6d1", value: 16.3 / 8 },
        { name: "#e3ded8", color: "#e3ded8", value: 16.3 / 8 },
        { name: "#dededc", color: "#dededc", value: 16.3 / 8 },
      ],
    },
    {
      name: "YELLOW",
      value: 6.1,
      color: "#d8cbb8",
      children: [
        { name: "#d8cbb8", color: "#d8cbb8", value: 6.1 / 3 },
        { name: "#d9d0bf", color: "#d9d0bf", value: 6.1 / 3 },
        { name: "#d5c9bb", color: "#d5c9bb", value: 6.1 / 3 },
      ],
    },
  ],
};
