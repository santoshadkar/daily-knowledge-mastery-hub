const https = require('https');
const { curriculumData } = require('../src/data/curriculum');

function verifyYouTubeOembed(videoUrl) {
  return new Promise((resolve) => {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    https.get(oembedUrl, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    }).on('error', () => resolve(false));
  });
}

async function validateAllMediaLinks() {
  console.log("🧪 Running Automated Link Audit on Curriculum Database...\n");
  let failed = 0;
  let total = 0;

  for (const concept of curriculumData) {
    for (const media of concept.media) {
      total++;
      const isValid = await verifyYouTubeOembed(media.url);
      if (!isValid) {
        console.error(`❌ Audit Failed for [${concept.id}] "${media.title}": ${media.url}`);
        failed++;
      } else {
        console.log(`✅ [${concept.id}] Valid: "${media.title}"`);
      }
    }
  }

  if (failed > 0) {
    console.error(`\n❌ Audit completed: ${failed} out of ${total} media links failed!`);
    process.exit(1);
  } else {
    console.log(`\n🎉 Audit completed: All ${total} media links passed 100% verification!`);
  }
}

validateAllMediaLinks();
