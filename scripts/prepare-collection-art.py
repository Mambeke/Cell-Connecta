"""Clip the customer's original collection scene; preserve original device/stone pixels.
Coordinates trace the photo at 1568x882. No substitute/generated device artwork.
"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import argparse
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('source',type=Path,help='Original customer-supplied four-iPhone PNG')
parser.add_argument('--preview',type=Path,help='Optional blended JPG preview')
args=parser.parse_args()
source=args.source
im=Image.open(source).convert('RGBA')
pts=[]
def line(x,y): pts.append((x,y))
def curve(a,b,c,d,e,f):
    x,y=pts[-1]
    for i in range(1,41):
        t=i/40;s=1-t
        pts.append((s*s*s*x+3*s*s*t*a+3*s*t*t*c+t*t*t*e,s*s*s*y+3*s*s*t*b+3*s*t*t*d+t*t*t*f))
line(89,882);line(89,815)
curve(88,796,89,791,107,786)
line(186,772)
curve(173,756,169,743,169,716)
line(169,127)
curve(169,100,181,76,203,68)
curve(218,62,229,60,249,65)
line(406,99)
curve(407,73,417,55,436,47)
curve(453,40,468,41,487,46)
line(671,85);line(672,70)
curve(675,43,684,26,705,20)
curve(722,14,737,15,755,20)
line(970,61)
curve(1005,67,1021,89,1023,127)
line(1024,714);line(1048,713);line(1048,151)
curve(1048,118,1067,104,1099,96)
line(1290,61)
curve(1316,56,1336,59,1350,75)
curve(1362,89,1366,101,1366,121)
line(1366,724)
curve(1430,722,1512,732,1548,746)
curve(1556,749,1557,758,1555,775)
line(1550,851);line(1505,882)
mask=Image.new('L',(im.width*2,im.height*2),0)
ImageDraw.Draw(mask).polygon([(x*im.width*2/1568,y*im.height*2/882) for x,y in pts],fill=255)
mask=mask.resize(im.size,Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(.4))
# Dissolve the cropped platform's bottom edge into the full-width campaign backdrop.
pix=mask.load()
for y in range(im.height-48,im.height):
    factor=(im.height-1-y)/47
    for x in range(im.width):pix[x,y]=round(pix[x,y]*factor)
im.putalpha(mask)
im.save(root/'public/cc-assets/hero-iphone-collection.webp',quality=94,method=6)
if args.preview:
    canvas=Image.new('RGBA',im.size,'#e2efff');canvas.alpha_composite(im)
    canvas.resize((1254,706)).convert('RGB').save(args.preview,quality=90)
print('Saved original-photo foreground:',im.size)
