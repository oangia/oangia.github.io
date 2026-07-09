const express = require('express');
const router = express.Router();
const db = require('goodmusic/db/MongoDBService');
const { slugify, vnlize } = require('goodmusic/utils/string');

// Home
router.get('/', async (req, res) => {
  try {
    let songs = await db.all("songs");

    songs = songs.map(song => ({
      ...song,
      performerSlug: slugify(vnlize(song.performer))
    }));

    res.render('home', {
      songs,
      pageTitle: 'mohopam – Hợp âm bài hát',
      pageDescription: 'Tìm kiếm và xem lời bài hát, hợp âm nhanh chóng.',
      pageKeywords: 'mohopam, lời bài hát, hợp âm',
      canonical: 'https://mohopam.com/',
      ogType: 'website',
      ogTitle: 'mohopam – Hợp âm bài hát',
      ogDescription: 'Tìm kiếm và xem lời bài hát, hợp âm nhanh chóng.',
      ogUrl: 'https://mohopam.com/'
    });
  } catch (e) {
    console.error(e);
    res.status(500).render('error', { message: 'Lỗi máy chủ' });
  }
});

const renderChords = (text) => {
  return text.split('\n').map(line => {
    if (!line.trim()) return '<p><br/></p>';

    const html = line.replace(/\[([^\]]+)\]\s*([^\s]+)/g, (_, chord, word) => {
      return `
        <span class="relative inline-block">
          <span class="absolute -top-5 left-0 text-red-500 whitespace-nowrap">[${chord}]</span>
          ${word}
        </span>
      `;
    });

    return `
      <p class="font-mono leading-[3]">
        ${html}
      </p>
    `;
  }).join('');
};

// Song detail
router.get('/:artistSlug/:songSlug', async (req, res) => {
  try {
    const { artistSlug, songSlug } = req.params;
    const song = await db.find("songs", { slug: songSlug });

    if (!song) {
      return res.status(404).render('error', { message: 'Không tìm thấy bài hát' });
    }
    song.chords = renderChords(song.chords);
    const searchQuery = req.query.q || '';

    res.render('songDetail', {
      song,
      searchQuery,
      pageTitle: `${song.title} Hợp âm - mohopam`,
      pageDescription: `${song.title} bởi ${song.performer}`,
      canonical: `https://mohopam.com/${artistSlug}/${song.slug}`,
      ogType: 'article',
      ogTitle: `${song.title} - mohopam`,
      ogDescription: `${song.title} bởi ${song.performer}`,
      ogUrl: `https://mohopam.com/${artistSlug}/${song.slug}`,
      schema: {
        "@context": "https://schema.org",
        "@type": "MusicComposition",
        name: song.title,
        byArtist: song.performer,
        description: song.genre || 'Lời bài hát và hợp âm',
        url: `https://mohopam.com/${artistSlug}/${song.slug}`
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).render('error', { message: 'Lỗi máy chủ' });
  }
});

// Ear training
router.get('/ear-training', (req, res) => {
  res.render('eartraining', { layout: false });
});

module.exports = router;