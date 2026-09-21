// People: the shared list that ships with the site, plus a personal library kept in this browser.

let myPeople = [];

function personId(name) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function allPeople() {
  const mine = myPeople.map((p) => ({ ...p, mine: true, tags: [...p.tags, 'mine'] }));
  const mineIds = new Set(mine.map((p) => p.id));
  return [...mine, ...window.GL_PEOPLE.filter((p) => !mineIds.has(p.id))];
}

function allTags() {
  return [...new Set(allPeople().flatMap((p) => p.tags))].sort();
}

function searchPeople(query, tag) {
  const q = query.trim().toLowerCase();
  return allPeople().filter(
    (p) => (!tag || p.tags.includes(tag)) && (!q || [p.name, p.company, p.role].some((s) => s.toLowerCase().includes(q)))
  );
}

function loadPersonPhoto(person) {
  if (person.photo) return Promise.resolve(person.photo);
  if (window.GL_PEOPLE_PHOTOS[person.id]) return Promise.resolve(window.GL_PEOPLE_PHOTOS[person.id]);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `people/data/${person.id}.js`;
    script.onload = () => resolve(window.GL_PEOPLE_PHOTOS[person.id]);
    script.onerror = () => reject(new Error(`No photo file for ${person.id}`));
    document.head.append(script);
  });
}

function speakerToPerson(speaker) {
  const onTeam = /genlayer/i.test(speaker.company);
  return {
    id: personId(speaker.name),
    name: speaker.name,
    role: speaker.role,
    company: speaker.company,
    tags: [onTeam ? 'team' : 'guest'],
    photo: speaker.photo,
  };
}

function savePerson(speaker) {
  const person = speakerToPerson(speaker);
  myPeople = [person, ...myPeople.filter((p) => p.id !== person.id)];
  store.set('library', myPeople);
}

function removePerson(id) {
  myPeople = myPeople.filter((p) => p.id !== id);
  store.set('library', myPeople);
}

function downloadJson(data, fileName) {
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), fileName);
}

async function importPeople(file) {
  const data = JSON.parse(await file.text());
  const incoming = (Array.isArray(data) ? data : [data]).filter((p) => p && p.id && p.name);
  const ids = new Set(incoming.map((p) => p.id));
  myPeople = [...incoming, ...myPeople.filter((p) => !ids.has(p.id))];
  store.set('library', myPeople);
  return incoming.length;
}
