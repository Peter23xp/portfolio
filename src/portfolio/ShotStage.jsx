import React, { forwardRef } from 'react';

import Device, { Browser, hostOf } from './Device.jsx';
import { pick } from '../lib/content.js';

// Mise en scène des captures d'un projet.
//  - captures mobiles seulement : un téléphone au premier plan, les autres en
//    retrait (variante « hero » : le téléphone principal seul) ;
//  - au moins une capture d'ordinateur : « duo » — la fenêtre de navigateur en
//    grand, la première capture mobile posée devant (téléphone devant l'écran).
const ShotStage = forwardRef(function ShotStage({ shots, kindOf, name, lang, siteUrl, variant = 'feature', className = '' }, ref) {
  const alt = (s, i) => pick(s, 'alt', lang) || `${name} — ${i + 1}`;
  const desk = shots.filter((s) => kindOf(s) === 'desktop');
  const mob = shots.filter((s) => kindOf(s) !== 'desktop');
  const host = hostOf(siteUrl);

  if (desk.length) {
    const phone = mob[0];
    return (
      <div ref={ref} className={`stage stage--duo stage--${variant} ${className}`}>
        <Browser className="stage__browser" src={desk[0].url} alt={alt(desk[0], shots.indexOf(desk[0]))} host={host} eager={variant === 'hero'} />
        {phone && <Device className="stage__phone" src={phone.url} alt={alt(phone, shots.indexOf(phone))} eager={variant === 'hero'} />}
      </div>
    );
  }

  const [lead, ...rest] = mob;
  const backs = variant === 'hero' ? [] : rest.slice(0, 2);
  return (
    <div ref={ref} className={`stage stage--${variant} ${className}`}>
      {backs.map((s, i) => (
        <Device key={s.url} className={`stage__back stage__back--${i + 1}`} src={s.url} alt={alt(s, i + 1)} />
      ))}
      <Device className="stage__lead" src={lead.url} alt={alt(lead, 0)} eager={variant === 'hero'} />
    </div>
  );
});

export default ShotStage;
