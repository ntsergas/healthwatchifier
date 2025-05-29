import { scrapeInfo } from '../utils/scrapeInfo.js';
import { TAGLINE } from '../utils/constants.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

export async function handleHealthwatchify(request) {
  try {
    const url = new URL(request.url).searchParams.get('url');
    if (!url) {
      return errorResponse('No URL provided', 400);
    }

    const { headline, image, url: cleanUrl, publication, articleType, authors } = await scrapeInfo(url);
    const text = `${headline} ${cleanUrl}\n\n${TAGLINE}`;

    return jsonResponse({
      title: headline,
      text,
      image,
      publication,
      articleType,
      authors
    });

  } catch (error) {
    return errorResponse(error.message);
  }
} 