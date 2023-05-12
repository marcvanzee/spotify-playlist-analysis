// Authorization token that must have been created previously. See : https://developer.spotify.com/documentation/web-api/concepts/authorization
const token = 'BQD_wofc2-vLFP33hPWa3cl00V4U6kp0zN4hHzkTLlm-Zwm2TwXhWGPKWOD27mXD_84omuGkElGo2j5LRapVfqGnT7pQoTFhbqr78OrgYgDlazvcwTh2MiMGbAuquOY-vofC_Xtm-HqpT6XADZNIg87mwiO5ZWcmdl3uSk1la-_-kL-Uw6FlV1EgtBFshW9QYFhcg6PWtWNWOhZeOyowsYGbByojytjl7zNNN-8RNItrWdskVk1eK949y92MaP5-S_s';

var _user_and_prefixes = {
  'marczoid': ['marcmix '],
  'joost_johnas': ['boys ', 'de boys gaan wat beleven', 'siem en marc gaan wat beleven'],
  'lilapause': ['de krochten'],
  'reneesteinmann': ['beste discover weekly'],
}

writeSettings();

// -------------- functions

function writeSettings() {
  html = 'Using the following usernames and playlist prefixes:<br>';
  html += '<ul>';
  for (const [user, prefixes] of Object.entries(_user_and_prefixes)) {
    html += `<li><b>${user}</b>: "` + prefixes.join('", "') + '"</li>';
  }
  html += '</ul>'
  setHtml('settings', html)
}


function setHtml(fieldId, text) {
  document.getElementById(fieldId).innerHTML = text
}

async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body:JSON.stringify(body)
  });
  return await res.json();
}

async function getIterative(url, filter_fn = (x) => x) {
  let result = []
  let offset = 0
  while (true) {
    const new_result = (await fetchWebApi(
      `${url}?limit=50&offset=${offset}`, 'GET'
    )).items.filter(filter_fn);
    if (new_result && new_result.length) {
      result = result.concat(new_result);
      offset += 50;
      if (just_one) {
        break;  // <-
      }
    } else {
      break;
    }
  }
  if (just_one) {
    return [result[0]]; // <-
  } else {
    return result;
  }
}

async function getPlaylistTracks(playlist_id) {
  tracks = await getIterative(
      `v1/playlists/${playlist_id}/tracks`, filter_fn = (x) => x, true)
  tracks = tracks.map(({track}) => ({
    'artist': track.artists.map((artist) => artist.name).join('_'),
    'name': track.name,
  }))
  return tracks
}

async function run_analysis(playlist_id) {
  document.getElementById('analysis').innerHTML = '<i>Running analysis...</i>'

  cur_playlist = playlists_by_id[playlist_id];
  html = `<h2>Analysis of ${cur_playlist.name}`;

  console.log(`Analyzing ${cur_playlist.name}`)

  num_tracks = cur_playlist.tracks.total;

  cur_tracks = 

  artists_count = {}

  console.log('cur_tracks', cur_tracks);

  for (const t of cur_tracks) {
    artist = t.track.artists.map((artist) => artist.name).join('_');
    if (artist in artists_count) {
      artists_count[artist]++;
    } else {
      artists_count[artist] = 1;
    }
  }

  artists_count = Object.fromEntries(Object.entries(artists_count).filter(([k,v]) => v>1));

  console.log('total tracks', num_tracks)
  console.log(artists_count);
}


async function getPlaylists(user) {
  function keep_playlist_fn(playlist) {
    prefixes = _user_and_prefixes[user];
    return prefixes.some(prefix => playlist.name.toLowerCase().startsWith(prefix))
  }

  async function process_playlist(playlist) {
    tracks = await getPlaylistTracks(playlist.id);
    return {
      'id': playlist.id,
      'name': playlist.name,
      'url': playlist.external_urls['spotify'],
      'user': user,
      'tracks': tracks,
    }
  }
  playlists = await getIterative(
      `v1/users/${user}/playlists`,
      keep_playlist_fn(playlist), true).map(process_playlist);

  return playlists;
}


async function getAllPlaylists() {
  document.getElementById('playlists').innerHTML = '<i>Retrieving playlists...</i>';

  all_playlists = []
  for (const user in _user_and_prefixes) {
    all_playlists = all_playlists.concat(await getPlaylists(user));
  }
  console.log('all playlists', all_playlists);

  write_playlists(playlists_by_user);
}