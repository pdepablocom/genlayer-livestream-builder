// Recurring shows. Picking one sets the template and fills in the usual content;
// everything stays editable afterwards. `episode: true` adds the numbered-episode field.
window.GL_SHOWS = [
  {
    id: 'gentalks',
    name: 'GenTalks',
    template: 'speakers',
    episode: true,
    defaults: {
      count: 2,
      title: 'GenTalks',
      subtitle: 'Conversations with the people\nbuilding on GenLayer',
    },
  },
  {
    id: 'ama',
    name: 'AMA Agent',
    template: 'speakers',
    defaults: {
      count: 3,
      title: 'GenLayer\nAMA',
      subtitle: 'Ask the founders\nCatch the latest news\nClaim a POAP live on the GenLayer portal',
    },
  },
  {
    id: 'agent-tank',
    name: 'Agent Tank Livestream',
    template: 'agent-tank',
    defaults: {
      count: 2,
      title: "GenLayer's\nHack\nathon",
    },
  },
  {
    id: 'builders-weekly',
    name: 'Builders Weekly Call',
    template: 'speakers',
    episode: true,
    defaults: {
      count: 1,
      title: 'Builders\nWeekly Call',
      subtitle: 'Open call for everyone\nbuilding on GenLayer',
    },
  },
];
