# Smart Zoom

**Status:** MVP

## Boundary

Text-only zoom: finds elements that directly contain text and scales their
`font-size` from the original computed size. Does **not** scale images, video,
SVG, iframes, or general page layout chrome.

Also applies line-height / letter-spacing / word-spacing on zoomed text nodes.

## Public surface

- Implements `IFeature` + contributes to `IStyleController`
- Emits: `zoom:applied`

## Depends on

- Settings / Storage
- Shared style tokens

## Must not

- Rewrite DOM structure
- Scale non-text media or whole-page transforms
