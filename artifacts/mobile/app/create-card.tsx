// Re-export the component directly so navigating to /create-card from a deck
// page keeps it in the same navigation stack (not the tab stack), allowing
// router.back() to correctly return to the deck instead of the home tab.
export { default } from "./(tabs)/create-card";
