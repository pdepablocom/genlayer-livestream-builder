// What the tool can make. Each entry picks a template and fills in the usual content;
// everything stays editable, and each one remembers what was last typed into it.
// `episode: true` adds the numbered-episode field (printed as a roman numeral).
window.GL_SHOWS = [
  {
    id: 'ama',
    name: 'GenLayer AMA',
    template: 'speakers',
    defaults: {
      count: 3,
      title: 'GenLayer\nAMA',
      subtitle: 'Ask the founders\nCatch the latest news\nClaim a POAP live on the GenLayer portal',
    },
  },
  {
    id: 'gentalks',
    name: 'GenTalks',
    template: 'gentalks',
    episode: true,
    defaults: { count: 2, title: 'Gen\nTalks', subtitle: 'Conversations with the people\nbuilding on GenLayer', episode: '14' },
  },
  {
    id: 'builders-weekly',
    name: 'Builders Weekly Call',
    template: 'builders-weekly',
    episode: true,
    defaults: {
      count: 1,
      title: 'Builders\nWeekly Call',
      subtitle: 'Open call for everyone\nbuilding on GenLayer',
      agenda: 'What shipped this week\nStudio and SDK updates\nCommunity demo\nOpen questions',
    },
  },
  {
    id: 'agent-tank',
    name: 'Agent Tank Livestream',
    template: 'agent-tank',
    defaults: { count: 2, title: "GenLayer's\nHack\nathon" },
  },
  {
    id: 'partnership',
    name: 'Partnership',
    template: 'partnership',
    defaults: { title: 'Internet Court New Integration: HOL' },
  },
  {
    id: 'announcement',
    name: 'Announcement',
    template: 'announcement',
    defaults: { title: 'Testnet Bradbury\nis live' },
  },
];
