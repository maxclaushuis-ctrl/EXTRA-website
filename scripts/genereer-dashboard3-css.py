"""Genereert client/src/styles/dashboard3.css: het dashboard in design 3.0.
Remapt de Tailwind-kleurklassen (paars en koel grijs) naar het warme espresso-
palet, alleen zolang body de klasse dash3 heeft (gezet door DashboardMockup)."""
import re, glob, sys, os
# Gebruik: python3 scripts/genereer-dashboard3-css.py  (vanuit de projectmap)
ROOT=sys.argv[1] if len(sys.argv)>1 else os.getcwd()
ESP={50:'#F6F4EF',100:'#EDEAE4',200:'#E2DED5',300:'#CFC9BE',400:'#A39E92',500:'#6E6A5F',600:'#37352C',700:'#2C2A23',800:'#22211B',900:'#1A1914',950:'#121210'}
WARM={50:'#FBFAF8',100:'#F3F1EC',200:'#E4E0D8',300:'#CFC9BE',400:'#A39E92',500:'#7A7468',600:'#5C594F',700:'#45433A',800:'#37352C',900:'#2C2A23',950:'#1A1914'}
FAM={'purple':ESP,'violet':ESP,'indigo':ESP,'fuchsia':ESP,'gray':WARM,'slate':WARM}
def rgb(h): h=h.lstrip('#'); return ' '.join(str(int(h[i:i+2],16)) for i in (0,2,4))
PSEUDO={'hover':':hover','focus':':focus','focus-visible':':focus-visible','focus-within':':focus-within','active':':active','disabled':':disabled','first':':first-child','last':':last-child','odd':':nth-child(odd)','even':':nth-child(even)','checked':':checked','visited':':visited','placeholder':'::placeholder','invalid':':invalid'}
MEDIA={'sm':640,'md':768,'lg':1024,'xl':1280,'2xl':1536}
def esc(c): return re.sub(r'([:/\[\]=.()&>!#%,])',r'\\\1',c)
def decl(prop,hexk,alpha):
    r=rgb(hexk)
    a=f'{int(alpha)/100:g}' if alpha else None
    if prop=='bg': return f'background-color:rgb({r} / {a or "var(--tw-bg-opacity,1)"})'
    if prop=='text': return f'color:rgb({r} / {a or "var(--tw-text-opacity,1)"})'
    if prop=='border': return f'border-color:rgb({r} / {a or "var(--tw-border-opacity,1)"})'
    if prop=='divide': return f'border-color:rgb({r} / {a or "var(--tw-divide-opacity,1)"})'
    if prop=='ring': return f'--tw-ring-color:rgb({r} / {a or "var(--tw-ring-opacity,1)"})'
    if prop=='placeholder': return f'color:rgb({r} / {a or "var(--tw-placeholder-opacity,1)"})'
    if prop=='fill': return f'fill:{hexk}'
    if prop=='stroke': return f'stroke:{hexk}'
    if prop=='outline': return f'outline-color:{hexk}'
    if prop=='accent': return f'accent-color:{hexk}'
    if prop=='caret': return f'caret-color:{hexk}'
    if prop=='decoration': return f'text-decoration-color:{hexk}'
    if prop=='shadow': return f'--tw-shadow-color:rgb({r} / {a or "1"});--tw-shadow:var(--tw-shadow-colored)'
    if prop=='from': return f'--tw-gradient-from:rgb({r} / {a or "1"}) var(--tw-gradient-from-position);--tw-gradient-to:rgb({r} / 0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to)'
    if prop=='via': return f'--tw-gradient-to:rgb({r} / 0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), rgb({r} / {a or "1"}) var(--tw-gradient-via-position), var(--tw-gradient-to)'
    if prop=='to': return f'--tw-gradient-to:rgb({r} / {a or "1"}) var(--tw-gradient-to-position)'
    if prop=='ring-offset': return f'--tw-ring-offset-color:{hexk}'
pat=re.compile(r'(?<![\w-])((?:[a-z0-9-]+(?:\[[^\]\s]+\])?:)*)(bg|text|border(?:-[trblxy])?|ring-offset|ring|from|via|to|fill|stroke|divide|outline|placeholder|accent|shadow|decoration|caret)-(purple|violet|indigo|fuchsia|gray|slate)-(50|100|200|300|400|500|600|700|800|900|950)(?:/(\d+))?(?![\w-])')
klassen=set()
for f in glob.glob(ROOT+'/client/src/**/*.ts*',recursive=True):
    if '/design3/' in f: continue
    for m in pat.finditer(open(f,encoding='utf8').read()): klassen.add(tuple(x or '' for x in m.groups()))
regels=[]; overgeslagen=set()
for varianten,prop,fam,shade,alpha in sorted(klassen,key=lambda g:(g[0].count(':'),g)):
    vs=[v for v in varianten.split(':') if v]
    if any(v=='dark' for v in vs): continue
    p=prop.split('-')[0] if prop.startswith('border-') else prop
    zijde={'t':'top','r':'right','b':'bottom','l':'left'}
    d=decl(p,FAM[fam][int(shade)],alpha)
    if prop.startswith('border-') and prop!='border':
        z=prop.split('-')[1]; kanten={'x':['left','right'],'y':['top','bottom']}.get(z,[zijde[z]])
        d=';'.join(f'border-{k}-color:rgb({rgb(FAM[fam][int(shade)])} / {int(alpha)/100 if alpha else "var(--tw-border-opacity,1)"})' for k in kanten)
    naam=varianten+f'{prop}-{fam}-{shade}'+(f'/{alpha}' if alpha else '')
    sel='.'+esc(naam); pre=''; media=None; ok=True
    for v in vs:
        if v in PSEUDO: sel+=PSEUDO[v]
        elif v in MEDIA: media=MEDIA[v]
        elif v=='group-hover': pre='.group:hover '
        elif v=='group-focus': pre='.group:focus '
        elif v.startswith('data-[') : sel+='['+v[6:-1]+']'
        elif v.startswith('aria-['): sel+='[aria-'+v[6:-1]+']'
        elif v=='aria-selected': sel+='[aria-selected="true"]'
        else: ok=False; overgeslagen.add(v)
    if not ok: continue
    if p=='divide': sel+=' > :not([hidden]) ~ :not([hidden])'
    if p=='placeholder' and '::placeholder' not in sel: sel+='::placeholder'
    regel=f'body.dash3 {pre}{sel}{{{d}}}'
    regels.append(f'@media (min-width:{media}px){{{regel}}}' if media else regel)
print(len(regels),'regels; overgeslagen varianten:',sorted(overgeslagen),file=sys.stderr)
# Schrijf deel 2 achter de handgeschreven kop in client/src/styles/dashboard3.css.
doel=ROOT+'/client/src/styles/dashboard3.css'
huidig=open(doel,encoding='utf8').read()
merk='/* Deel 2: gegenereerd. */'
open(doel,'w',encoding='utf8').write(huidig.split(merk)[0]+merk+'\n'+'\n'.join(regels)+'\n')
