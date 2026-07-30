/**
 * Dual-track copy.
 *
 * `explorer` is written for a curious child: concrete, physical, comparative,
 * no jargon without an immediate cash-out. `scientist` assumes interest and
 * gives real numbers and mechanisms.
 *
 * The mode switch changes voice and units, never layout -- so a parent and a
 * child looking at the same screen see the same thing described two ways.
 */

export interface BodyCopy {
  tagline: { explorer: string; scientist: string };
  summary: { explorer: string; scientist: string };
  facts: Array<{ explorer: string; scientist: string }>;
}

export const COPY: Record<string, BodyCopy> = {
  sun: {
    tagline: {
      explorer: 'The star we live next to',
      scientist: 'G2V main-sequence star',
    },
    summary: {
      explorer:
        'The Sun is a giant ball of glowing gas, and it is so big that about a million Earths would fit inside it. Everything you can see in the sky here is going round it, held on by its gravity. Its light takes eight minutes to reach us, so you never see the Sun as it is right now — always as it was eight minutes ago.',
      scientist:
        'The Sun holds 99.86% of the mass of the solar system. Hydrogen fuses to helium in its core at roughly 15 million K, converting about 4.3 million tonnes of mass into energy every second. That energy takes tens of thousands of years to random-walk out through the radiative zone, then eight minutes and twenty seconds to cross to Earth.',
    },
    facts: [
      {
        explorer: 'The Sun is not on fire. It is squeezing hydrogen so hard that it turns into helium, and that is what makes the light.',
        scientist: 'Core fusion proceeds via the proton-proton chain, releasing 26.7 MeV per helium-4 nucleus formed.',
      },
      {
        explorer: 'Its surface has bubbles the size of Texas, boiling up and sinking back down.',
        scientist: 'Photospheric granulation cells average 1,000 km across and turn over on a five-to-ten minute timescale.',
      },
      {
        explorer: 'The Sun spins faster at its middle than at its top and bottom, because it is not solid.',
        scientist: 'Differential rotation: 24.5 days at the equator against about 34 days near the poles.',
      },
    ],
  },

  mercury: {
    tagline: { explorer: 'The smallest, fastest planet', scientist: 'Innermost terrestrial planet' },
    summary: {
      explorer:
        'Mercury races around the Sun faster than any other planet — a whole year there takes only 88 Earth days. It has almost no air, so there is nothing to hold the heat in. That means it is roasting in the daylight and freezing at night, with the biggest temperature swing of any planet.',
      scientist:
        'Mercury has the most eccentric orbit of the planets (e = 0.206) and is locked in a 3:2 spin-orbit resonance, so it rotates three times for every two orbits. With a negligible exosphere, surface temperatures swing from about 100 K to 700 K.',
    },
    facts: [
      { explorer: 'One day on Mercury lasts longer than two of its years.', scientist: 'The solar day is 176 Earth days; the orbital period is 88.' },
      { explorer: 'It is covered in craters because it has no air to burn up incoming rocks.', scientist: 'Absent an atmosphere, the surface preserves an impact record going back roughly 4 billion years.' },
      { explorer: 'There is ice hiding in craters at its poles that sunlight never reaches.', scientist: 'Radar-bright deposits in permanently shadowed polar craters are consistent with water ice.' },
    ],
  },

  venus: {
    tagline: { explorer: 'The hottest planet of all', scientist: 'Runaway greenhouse world' },
    summary: {
      explorer:
        'Venus is nearly the same size as Earth, but its thick clouds trap so much heat that it is hotter than Mercury even though it is further from the Sun. It is hot enough to melt lead. It also spins backwards, so on Venus the Sun rises in the west.',
      scientist:
        'A 92-bar CO2 atmosphere drives a runaway greenhouse holding the surface at 737 K — hotter than Mercury despite receiving a quarter of the sunlight per square metre. Rotation is retrograde with a 243-day period, longer than its 225-day year.',
    },
    facts: [
      { explorer: 'A day on Venus is longer than a year on Venus.', scientist: 'Sidereal rotation 243.0 days against an orbital period of 224.7 days.' },
      { explorer: 'Its clouds are made of acid, not water.', scientist: 'The cloud decks are concentrated sulfuric acid droplets between 48 and 70 km altitude.' },
      { explorer: 'The air is so heavy it would squash you like being 900 m underwater.', scientist: 'Surface pressure is 9.2 MPa, equivalent to about 900 m of seawater.' },
    ],
  },

  earth: {
    tagline: { explorer: 'Our home, the ocean planet', scientist: 'The only known inhabited world' },
    summary: {
      explorer:
        'Earth is the only place we know of where anything is alive. It has liquid water on the surface, air you can breathe, and a magnetic shield that deflects dangerous particles from the Sun. From space, the thing you notice first is how blue it is — and how thin the layer of air really looks.',
      scientist:
        'Earth sits in the circumstellar habitable zone with sufficient atmospheric pressure for liquid surface water. A liquid iron outer core generates a magnetosphere that deflects the solar wind, and plate tectonics drives a carbonate-silicate cycle that has buffered surface temperature over geological time.',
    },
    facts: [
      { explorer: 'The Moon is slowly drifting away from us, about as fast as your fingernails grow.', scientist: 'Lunar recession measured by laser ranging is 3.8 cm per year, driven by tidal dissipation.' },
      { explorer: 'Earth is not a perfect ball — it bulges out at the middle because it spins.', scientist: 'Equatorial radius exceeds polar by 21 km, a flattening of 1/298.' },
      { explorer: 'Our seasons happen because Earth is tilted, not because we get closer to the Sun.', scientist: 'The 23.44 degree obliquity dominates; Earth is in fact at perihelion in early January.' },
    ],
  },

  luna: {
    tagline: { explorer: 'Our one and only Moon', scientist: 'Earth’s tidally locked satellite' },
    summary: {
      explorer:
        'The Moon always shows us the same face, because it turns exactly once for every trip around Earth. Its dark patches are ancient lava that flooded huge craters billions of years ago and then froze solid. It is the only other world people have stood on.',
      scientist:
        'The Moon is in 1:1 spin-orbit resonance with Earth. The maria are basaltic flood plains that filled large impact basins between 3.9 and 3.1 billion years ago. Its composition closely matches Earth’s mantle, supporting a giant-impact origin.',
    },
    facts: [
      { explorer: 'Footprints left by astronauts will still be there in a million years.', scientist: 'With no atmosphere and negligible erosion, surface features degrade only through micrometeorite gardening.' },
      { explorer: 'The Moon causes the tides by pulling the ocean towards it.', scientist: 'The tidal bulge arises from the gradient of lunar gravity across Earth’s diameter.' },
    ],
  },

  mars: {
    tagline: { explorer: 'The rusty red planet', scientist: 'Cold desert world with a thin CO2 atmosphere' },
    summary: {
      explorer:
        'Mars is red because its dust is full of rust — literally iron oxide, the same stuff on an old bicycle. It has the biggest volcano and the deepest canyon in the whole solar system. Billions of years ago it had rivers and lakes, and we are still looking for signs that something lived in them.',
      scientist:
        'Mars retains a 6 mbar CO2 atmosphere, too thin for liquid water at most surface pressures. Valles Marineris runs 4,000 km with depths to 7 km, and Olympus Mons rises 22 km — both consequences of a stagnant lid and no plate recycling.',
    },
    facts: [
      { explorer: 'Olympus Mons is nearly three times the height of Mount Everest.', scientist: 'Olympus Mons stands 21.9 km above datum with a base 600 km across.' },
      { explorer: 'Mars has two tiny lumpy moons that look like potatoes.', scientist: 'Phobos and Deimos are 22 km and 12 km across, likely captured or re-accreted debris.' },
      { explorer: 'Its polar caps are partly frozen air, and they shrink and grow with the seasons.', scientist: 'Seasonal caps are CO2 frost; roughly 25% of the atmosphere condenses out each winter.' },
    ],
  },

  phobos: {
    tagline: { explorer: 'A moon on a collision course', scientist: 'Inner Martian satellite, decaying orbit' },
    summary: {
      explorer: 'Phobos orbits Mars so fast that it rises and sets twice in a single Martian day. It is also slowly spiralling inwards, and in about 50 million years Mars will tear it apart.',
      scientist: 'Phobos orbits below areostationary altitude, so tidal interaction drags it inward at about 1.8 cm per year. It will reach the Roche limit in 30-50 Myr.',
    },
    facts: [
      { explorer: 'You could jump off Phobos and drift into space.', scientist: 'Escape velocity is 11 m/s — comfortably within human sprinting speed.' },
    ],
  },

  deimos: {
    tagline: { explorer: 'Mars’s tiny outer moon', scientist: 'Outer Martian satellite' },
    summary: {
      explorer: 'Deimos is so small and so far out that from the surface of Mars it looks like a bright star rather than a moon.',
      scientist: 'At 12 km mean diameter and 23,460 km out, Deimos subtends only about 2.5 arcminutes from the Martian surface.',
    },
    facts: [
      { explorer: 'It is the smallest known moon of any planet.', scientist: 'Deimos is the smallest confirmed planetary satellite in the solar system.' },
    ],
  },

  jupiter: {
    tagline: { explorer: 'The giant with a storm bigger than Earth', scientist: 'Gas giant, 318 Earth masses' },
    summary: {
      explorer:
        'Jupiter is so big that all the other planets could fit inside it with room to spare. It has no solid ground — if you tried to land you would just keep falling through thicker and thicker gas. Its stripes are winds racing in opposite directions, and the Great Red Spot is a storm that has been blowing for centuries.',
      scientist:
        'Jupiter contains 2.5 times the mass of all other planets combined. Alternating zonal jets reach 150 m/s, and the Great Red Spot is an anticyclone that has been under continuous observation since at least 1831, currently about 1.3 Earth diameters across and shrinking.',
    },
    facts: [
      { explorer: 'A day on Jupiter is under 10 hours — it spins faster than any other planet.', scientist: 'Rotation period 9h 55m, producing a 6.5% equatorial bulge.' },
      { explorer: 'It has at least 95 moons, and four of them are bigger than Pluto.', scientist: 'The Galilean satellites Io, Europa, Ganymede and Callisto all exceed Pluto in diameter.' },
      { explorer: 'Jupiter acts like a shield, pulling in comets that might otherwise hit us.', scientist: 'Its gravity dominates the outer scattering of small bodies, though whether the net effect on inner-system impact rates is protective remains debated.' },
    ],
  },

  io: {
    tagline: { explorer: 'The most volcanic place in the solar system', scientist: 'Tidally heated volcanic satellite' },
    summary: {
      explorer:
        'Io has hundreds of volcanoes erupting all the time, throwing sulfur hundreds of kilometres into space. Jupiter’s gravity squeezes and stretches it constantly, and all that squeezing turns into heat.',
      scientist:
        'Laplace-resonance forcing from Europa and Ganymede maintains Io’s orbital eccentricity, and the resulting tidal dissipation delivers roughly 100 trillion watts. Over 400 active volcanoes resurface the moon within a million years.',
    },
    facts: [
      { explorer: 'Its whole surface is repainted by volcanoes faster than craters can form.', scientist: 'Resurfacing rate of about 1 cm/year leaves Io essentially crater-free.' },
    ],
  },

  europa: {
    tagline: { explorer: 'An ocean hidden under ice', scientist: 'Subsurface ocean candidate' },
    summary: {
      explorer:
        'Under Europa’s cracked shell of ice there is a salty ocean with more water than every ocean on Earth put together. It is one of the best places to look for life beyond Earth.',
      scientist:
        'Magnetometer data from Galileo indicates an induced field consistent with a global conducting layer — a salty ocean 60-150 km deep beneath a 15-25 km ice shell, containing perhaps twice Earth’s surface water.',
    },
    facts: [
      { explorer: 'Its surface is the smoothest of any solid object we know.', scientist: 'Relief rarely exceeds a few hundred metres across the entire moon.' },
      { explorer: 'The long brown lines are cracks where the ice pulls apart and refreezes.', scientist: 'Linea are extensional bands, stained by irradiated salts and sulfur compounds.' },
    ],
  },

  ganymede: {
    tagline: { explorer: 'The biggest moon in the solar system', scientist: 'Largest satellite; only moon with a magnetosphere' },
    summary: {
      explorer: 'Ganymede is bigger than the planet Mercury. It is the only moon that makes its own magnetic field.',
      scientist: 'At 2,634 km radius Ganymede exceeds Mercury in size, though not in mass. A convecting iron core generates an intrinsic magnetic field embedded within Jupiter’s magnetosphere.',
    },
    facts: [
      { explorer: 'If it orbited the Sun instead of Jupiter, we would call it a planet.', scientist: 'It satisfies the size and shape criteria for planethood; only its orbit around Jupiter excludes it.' },
    ],
  },

  callisto: {
    tagline: { explorer: 'The most cratered world we know', scientist: 'Undifferentiated icy satellite' },
    summary: {
      explorer: 'Callisto is so old and so still that its surface is completely saturated with craters — there is no room left for new ones without erasing old ones.',
      scientist: 'Callisto shows no evidence of tidal heating or resurfacing; its crater density is at geometric saturation, indicating a surface age near 4 billion years.',
    },
    facts: [
      { explorer: 'It sits outside Jupiter’s worst radiation, which makes it a good place for a future base.', scientist: 'Radiation dose at Callisto is roughly 0.01 Sv/day, orders of magnitude below Europa’s.' },
    ],
  },

  saturn: {
    tagline: { explorer: 'The planet with the beautiful rings', scientist: 'Ringed gas giant, lowest mean density' },
    summary: {
      explorer:
        'Saturn’s rings look solid from far away, but they are actually billions of separate chunks of ice, from grains of sand up to house-sized boulders, all orbiting in a disc thinner than a skyscraper is tall. Saturn itself is so light for its size that it would float in a big enough bathtub.',
      scientist:
        'At 0.687 g/cm3 Saturn is less dense than water. The rings span 280,000 km but average only about 10 m thick, and are more than 95% water ice. The Cassini division at 117,580-122,170 km is cleared by a 2:1 resonance with Mimas.',
    },
    facts: [
      { explorer: 'The rings are less than a kilometre thick but wider than the distance to the Moon.', scientist: 'Main ring system radius 140,000 km; vertical thickness typically 10-20 m.' },
      { explorer: 'There is a six-sided cloud pattern at its north pole that nobody expected.', scientist: 'The north polar hexagon is a stationary Rossby wave in the jet stream, about 30,000 km across.' },
      { explorer: 'Its moon Enceladus shoots jets of water into space from cracks at its south pole.', scientist: 'Enceladus’s south-polar plumes vent 200 kg/s of water vapour and supply the E ring.' },
    ],
  },

  enceladus: {
    tagline: { explorer: 'The moon with geysers', scientist: 'Cryovolcanic ocean moon' },
    summary: {
      explorer: 'Enceladus fires enormous jets of salty water out of cracks near its south pole. Some of that water escapes and forms one of Saturn’s rings.',
      scientist: 'Plumes from the "tiger stripe" fractures carry water vapour, salts, silica nanograins and organics, implying hydrothermal activity at a rocky seafloor beneath a global ocean.',
    },
    facts: [
      { explorer: 'It is the shiniest object in the solar system — it reflects almost all the light that hits it.', scientist: 'Bond albedo of 0.81, the highest of any known solar system body.' },
    ],
  },

  titan: {
    tagline: { explorer: 'A world with rivers of liquid methane', scientist: 'Only moon with a substantial atmosphere' },
    summary: {
      explorer:
        'Titan is the only moon with a proper atmosphere — thicker than Earth’s. It has clouds, rain, rivers, lakes and seas, but they are made of liquid methane instead of water, because it is far too cold there for water to be anything but rock-hard ice.',
      scientist:
        'Titan’s 1.5-bar nitrogen atmosphere supports an active methane hydrological cycle at 94 K. Ligeia Mare and Kraken Mare are hydrocarbon seas hundreds of kilometres across; the crust is water ice behaving as bedrock.',
    },
    facts: [
      { explorer: 'You could strap wings to your arms and fly, because the air is thick and the gravity is weak.', scientist: 'Four times Earth’s atmospheric density at one seventh the gravity makes human-powered flight feasible.' },
    ],
  },

  iapetus: {
    tagline: { explorer: 'The two-toned moon', scientist: 'Extreme hemispheric albedo dichotomy' },
    summary: {
      explorer: 'One side of Iapetus is as bright as snow and the other is as dark as coal. It is also lumpy, with a strange ridge running right around its equator like a walnut.',
      scientist: 'Cassini Regio, the leading hemisphere, has an albedo near 0.05 against 0.6 on the trailing side, driven by thermal segregation after dust infall. An equatorial ridge up to 20 km high spans 1,300 km.',
    },
    facts: [
      { explorer: 'Its equator has a mountain ridge 20 km high, three times taller than Everest.', scientist: 'The origin of the equatorial ridge remains unresolved; ring collapse and despinning are both proposed.' },
    ],
  },

  uranus: {
    tagline: { explorer: 'The planet that rolls on its side', scientist: 'Ice giant with 98 degree obliquity' },
    summary: {
      explorer:
        'Something enormous must have hit Uranus long ago, because it is tipped right over and rolls around the Sun on its side. That means its poles get 42 years of continuous daylight followed by 42 years of darkness. It looks like a plain blue-green ball because methane in its air absorbs red light.',
      scientist:
        'Uranus’s 97.8 degree axial tilt, likely the result of a giant impact, produces extreme seasonal forcing over its 84-year orbit. Methane absorption beyond 600 nm gives the cyan colour. It is the coldest planetary atmosphere in the system at 49 K minimum.',
    },
    facts: [
      { explorer: 'Its poles get 42 years of daylight, then 42 years of night.', scientist: 'The extreme obliquity means each pole faces the Sun continuously for half the 84-year orbit.' },
      { explorer: 'It has rings too, but they are thin and dark and very hard to see.', scientist: 'Thirteen narrow rings, discovered by stellar occultation in 1977, with albedos near 0.03.' },
    ],
  },

  titania: {
    tagline: { explorer: 'Uranus’s biggest moon', scientist: 'Largest Uranian satellite' },
    summary: {
      explorer: 'Titania is scarred with enormous canyons, formed when its interior froze and expanded, cracking the surface open.',
      scientist: 'Extensional graben up to 1,600 km long indicate global expansion during freezing of a subsurface layer.',
    },
    facts: [
      { explorer: 'Its biggest canyon is longer than the length of Great Britain.', scientist: 'Messina Chasmata extends roughly 1,500 km.' },
    ],
  },

  neptune: {
    tagline: { explorer: 'The windiest planet', scientist: 'Outermost ice giant' },
    summary: {
      explorer:
        'Neptune has the fastest winds anywhere in the solar system — over 2,000 km/h, faster than the speed of sound on Earth. It is so far away that sunlight there is 900 times dimmer than here, and it takes 165 Earth years to go round the Sun just once.',
      scientist:
        'Neptune’s equatorial jets reach 580 m/s despite receiving 1/900th of Earth’s insolation, driven largely by internal heat: it radiates 2.6 times the energy it absorbs. Orbital period is 164.8 years.',
    },
    facts: [
      { explorer: 'It was found using maths before anyone actually looked at it.', scientist: 'Le Verrier and Adams independently predicted its position from perturbations in Uranus’s orbit; Galle confirmed it in 1846 within one degree.' },
      { explorer: 'It has only completed one orbit since it was discovered.', scientist: 'Neptune returned to its 1846 discovery position in July 2011.' },
    ],
  },

  triton: {
    tagline: { explorer: 'A moon going the wrong way', scientist: 'Captured Kuiper belt object' },
    summary: {
      explorer:
        'Triton orbits Neptune backwards, which means it did not form there — Neptune captured it. It is one of the coldest places we have ever measured, and it still has ice volcanoes erupting nitrogen.',
      scientist:
        'Triton’s retrograde, highly inclined orbit marks it as a captured Kuiper belt object. At 38 K it is among the coldest measured surfaces; Voyager 2 observed active nitrogen geysers.',
    },
    facts: [
      { explorer: 'Because it goes the wrong way, it is slowly falling towards Neptune.', scientist: 'Retrograde tidal evolution is decaying the orbit; Triton will reach the Roche limit in roughly 3.6 Gyr.' },
    ],
  },

  pluto: {
    tagline: { explorer: 'The famous dwarf planet', scientist: 'Kuiper belt dwarf planet' },
    summary: {
      explorer:
        'Pluto was called the ninth planet for 76 years, until we found lots of other objects like it out there and decided it needed a new category. It has a huge bright patch shaped like a heart, made of frozen nitrogen, and mountains made of water ice that are as hard as rock at those temperatures.',
      scientist:
        'Reclassified in 2006 for failing to clear its orbital neighbourhood. Sputnik Planitia is a 1,000 km nitrogen-ice glacier convecting on a ~500,000 year timescale. Pluto is in a 3:2 mean-motion resonance with Neptune, which prevents close encounters.',
    },
    facts: [
      { explorer: 'Pluto and its moon Charon spin around each other like a dumbbell.', scientist: 'The barycentre lies outside Pluto’s surface, making it the only known binary dwarf planet system in the solar system.' },
      { explorer: 'Sometimes Pluto is closer to the Sun than Neptune is.', scientist: 'Between 1979 and 1999 Pluto was inside Neptune’s orbit; the 3:2 resonance ensures they never approach closely.' },
    ],
  },

  charon: {
    tagline: { explorer: 'Pluto’s giant partner', scientist: 'Pluto’s largest satellite' },
    summary: {
      explorer: 'Charon is half the size of Pluto, which is enormous for a moon. They are locked facing each other forever, so from one side of Pluto you would always see Charon hanging in the same spot in the sky.',
      scientist: 'At 0.51 Pluto’s diameter, Charon is the largest satellite relative to its primary. The pair is doubly tidally locked, each keeping one face permanently toward the other.',
    },
    facts: [
      { explorer: 'Its north pole is stained red by gas that escaped from Pluto.', scientist: 'Mordor Macula is tholin residue from methane escaping Pluto and freezing onto Charon’s cold pole.' },
    ],
  },
};

export const DEFAULT_COPY: BodyCopy = {
  tagline: { explorer: 'A world in our solar system', scientist: 'Solar system body' },
  summary: { explorer: '', scientist: '' },
  facts: [],
};

export const copyFor = (id: string): BodyCopy => COPY[id] ?? DEFAULT_COPY;
