import { scrapeInfo } from '../utils/scrapeInfo.js';
import { extractImageCaption } from '../utils/imageCaptions.js';
import { TAGLINE } from '../utils/constants.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

export async function handleHealthwatchify(request) {
  try {
    const url = new URL(request.url).searchParams.get('url');
    if (!url) {
      return errorResponse('No URL provided', 400);
    }

    const { headline, image, url: cleanUrl, publication, articleType, authors, wasAssociatedPress, isPaywalled, html } = await scrapeInfo(url);
    const caption = html ? extractImageCaption(html, url) : '';
    const text = `${headline} ${cleanUrl}\n\n${TAGLINE}`;

    return jsonResponse({
      title: headline,
      text,
      image,
      caption,
      publication,
      articleType,
      authors,
      wasAssociatedPress,
      isPaywalled
    });

  } catch (error) {
    return errorResponse(error.message);
  }
} 