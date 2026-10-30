from __future__ import annotations

import base64
import html
from pathlib import Path


ROOT = Path(__file__).resolve().parent
LOGO = ROOT / 'durga-bari-logo.png'
LOGO_DATA = base64.b64encode(LOGO.read_bytes()).decode('ascii')

PARKING = [
    ('2260', 'BB Power Breaker', 15),
    ('2250A', 'David Carey', 8),
    ('2250B', 'Dynamic Precision Welding / J&S Welding', 8),
    ('2275', 'American Gasket', 15),
    ('2245', 'The Scene Shop', 15),
    ('2149', 'Opera San Jose', 35),
    ('2315', 'Artnet Pro', 15),
    ('2305', 'Arrow', 15),
    ('2345', 'Insulectro', 80),
    ('2375', 'California Mailing Service', 8),
]
TOTAL_SPOTS = sum(spots for _, _, spots in PARKING)


def text(x: int, y: int, value: str, *, size: int, color: str,
         weight: int = 400, spacing: str | None = None) -> str:
    spacing_attr = f' letter-spacing="{spacing}"' if spacing else ''
    return (f'<text x="{x}" y="{y}" fill="{color}" font-family="Avenir Next, Arial, sans-serif" '
            f'font-size="{size}" font-weight="{weight}"{spacing_attr}>'
            f'{html.escape(value)}</text>')


def shell() -> list[str]:
    return [
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
        'width="1080" height="1350" viewBox="0 0 1080 1350">',
        '<defs><linearGradient id="paper" x2="0" y2="1">'
        '<stop stop-color="#FFF9F0"/><stop offset="1" stop-color="#F9F0E3"/>'
        '</linearGradient><linearGradient id="wine" x2="1" y2="1">'
        '<stop stop-color="#81271B"/><stop offset="1" stop-color="#58170F"/>'
        '</linearGradient></defs>',
        '<rect width="1080" height="1350" fill="url(#paper)"/>',
        '<rect x="16" y="16" width="1048" height="1318" rx="24" fill="none" stroke="#D6AC72" stroke-width="2"/>',
        '<path d="M55 33 H1025" stroke="#B77A36" stroke-width="5" stroke-linecap="round"/>',
        f'<image x="62" y="49" width="223" height="211" xlink:href="data:image/png;base64,{LOGO_DATA}"/>',
        text(321, 92, 'DURGA BARI  •  SAN JOSE', size=24, color='#9A5A23', weight=700, spacing='3'),
        text(316, 172, 'PARKING', size=83, color='#681D16', weight=800, spacing='1'),
        text(316, 251, 'GUIDE', size=83, color='#681D16', weight=800, spacing='1'),
        '<path d="M321 266 H1016" stroke="#D7B484" stroke-width="3"/>',
        '<rect x="54" y="293" width="972" height="169" rx="26" fill="url(#wine)"/>',
        '<rect x="77" y="318" width="11" height="119" rx="5" fill="#E5B76A"/>',
        text(112, 340, 'OVERFLOW PARKING', size=25, color='#F2C477', weight=700, spacing='2'),
        text(111, 383, 'Our neighbors have graciously offered', size=32, color='#FFF9F0', weight=700),
        text(111, 419, 'their parking spots to us.', size=32, color='#FFF9F0', weight=700),
        text(112, 449, 'Weekends  •  Weekdays after 6 PM', size=26, color='#F2C477', weight=700),
    ]


def footer(parts: list[str], note: str) -> None:
    parts.extend([
        '<path d="M55 1255 H1025" stroke="#D7B484" stroke-width="2"/>',
        text(57, 1294, 'DURGA BARI  •  2350 PARAGON DR, SAN JOSE, CA 95131',
             size=23, color='#681D16', weight=700, spacing='0.6'),
        text(57, 1318, note, size=17, color='#816C5F'),
        '</svg>',
    ])


def poster_card(parts: list[str], address: str, business: str, spots: int, x: int, y: int) -> None:
    parts.append(f'<rect x="{x}" y="{y}" width="472" height="118" rx="17" fill="#FFFEFB" '
                 'stroke="#E9D7C4" stroke-width="2"/>')
    parts.append(f'<rect x="{x+366}" y="{y+18}" width="89" height="80" rx="14" fill="#F3E5D3"/>')
    parts.append(text(x+386 if spots < 10 else x+378, y+58, str(spots), size=37, color='#8B3B22', weight=800))
    parts.append(text(x+381, y+83, 'SPOTS', size=16, color='#8B3B22', weight=800, spacing='0.4'))
    parts.append(text(x+21, y+48, f'{address} Paragon Dr', size=31, color='#541A14', weight=800))
    if business == 'Dynamic Precision Welding / J&S Welding':
        parts.append(text(x+22, y+80, 'Dynamic Precision Welding /', size=20, color='#67564B', weight=600))
        parts.append(text(x+22, y+105, 'J&S Welding', size=20, color='#67564B', weight=600))
    else:
        parts.append(text(x+22, y+86, business, size=23, color='#67564B', weight=600))


def make_poster() -> None:
    parts = shell()
    parts.extend([
        text(54, 516, f'{TOTAL_SPOTS} SPOTS ACROSS 10 LOCATIONS',
             size=27, color='#681D16', weight=800, spacing='1'),
    ])
    for i, (address, business, spots) in enumerate(PARKING):
        col, row = divmod(i, 5)
        poster_card(parts, address, business, spots, 54 + col*500, 570 + row*128)
    footer(parts, 'All parking is close to Durga Bari. Please follow posted parking signs.')
    (ROOT / 'durga-bari-parking-poster.svg').write_text('\n'.join(parts), encoding='utf-8')


def carousel_card(parts: list[str], address: str, business: str, spots: int, y: int) -> None:
    parts.append(f'<rect x="54" y="{y}" width="972" height="127" rx="19" fill="#FFFEFB" '
                 'stroke="#E9D7C4" stroke-width="2"/>')
    parts.append(f'<rect x="840" y="{y+24}" width="157" height="79" rx="17" fill="#F3E5D3"/>')
    parts.append(text(871 if spots < 10 else 860, y+65, str(spots), size=39, color='#8B3B22', weight=800))
    parts.append(text(869, y+91, 'SPOTS', size=18, color='#8B3B22', weight=800, spacing='0.8'))
    parts.append(text(82, y+59, f'{address} Paragon Dr', size=47, color='#541A14', weight=800))
    parts.append(text(84, y+104, business, size=29, color='#67564B', weight=600))


def make_carousel(slide: int) -> None:
    parts = shell()
    parts.extend([
        text(54, 515, f'{TOTAL_SPOTS} SPOTS ACROSS 10 LOCATIONS',
             size=27, color='#681D16', weight=800, spacing='1'),
        text(866, 515, f'{slide} OF 2', size=22, color='#9A5A23', weight=800, spacing='1'),
    ])
    for row, (address, business, spots) in enumerate(PARKING[(slide-1)*5:slide*5]):
        carousel_card(parts, address, business, spots, 547 + row*140)
    footer(parts, 'All parking is close to Durga Bari. Follow posted signs. Save both slides.')
    (ROOT / f'durga-bari-parking-carousel-{slide}.svg').write_text('\n'.join(parts), encoding='utf-8')


if __name__ == '__main__':
    ROOT.mkdir(parents=True, exist_ok=True)
    make_poster()
    make_carousel(1)
    make_carousel(2)
