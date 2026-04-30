export const BACKGROUND_OPTIONS = [
  {
    value: "login",
    label: "Login Screen",
    file: "login_screen.png",
  },
  {
    value: "bubbles",
    label: "Bubbles",
    file: "Bubbles.png",
  },
  {
    value: "drops",
    label: "Drops",
    file: "Drops.png",
  },
  {
    value: "galaxy",
    label: "Galaxy",
    file: "Galaxy.png",
  },
  {
    value: "no-tree",
    label: "No Tree",
    file: "no_tree.png",
  },
  {
    value: "no-tree-blur",
    label: "No Tree Blur",
    file: "no_tree-blur.png",
  },
  {
    value: "pink-moon",
    label: "Pink Moon",
    file: "pink_moon.png",
  },
  {
    value: "sky",
    label: "Sky",
    file: "sky.jpg",
  },
  {
    value: "space",
    label: "Space",
    file: "space.png",
  },
];

export function getBackgroundStyle(value) {
  const selectedBackground =
    BACKGROUND_OPTIONS.find((option) => option.value === value) ||
    BACKGROUND_OPTIONS[0];

  return {
    backgroundImage: `linear-gradient(rgba(255,255,255,0.22), rgba(255,255,255,0.22)), url("/MedizinApp/${selectedBackground.file}")`,
  };
}