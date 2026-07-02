module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/lib/scoring.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "recommend",
    ()=>recommend
]);
const BASE_WEIGHTS = {
    budgetFit: 0.2,
    bodyFit: 0.2,
    usageFit: 0.2,
    fuelFit: 0.2,
    safety: 0.2
};
// Each buyer priority speaks most directly to one scoring dimension; that
// dimension gets extra weight before the weights are renormalized to 1.
const PRIORITY_TO_DIMENSION = {
    budget: "budgetFit",
    space: "bodyFit",
    performance: "usageFit",
    mileage: "fuelFit",
    safety: "safety"
};
const PRIORITY_BOOST = 0.2;
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function getWeights(priority) {
    const weights = {
        ...BASE_WEIGHTS
    };
    weights[PRIORITY_TO_DIMENSION[priority]] += PRIORITY_BOOST;
    const total = Object.values(weights).reduce((sum, w)=>sum + w, 0);
    Object.keys(weights).forEach((dim)=>{
        weights[dim] /= total;
    });
    return weights;
}
function scoreBudgetFit(car, profile) {
    const ratio = car.price / profile.budget;
    if (ratio <= 0.7) return 100;
    const overage = ratio - 0.7; // up to 0.3 for a car priced right at budget
    return clamp(100 - overage * (50 / 0.3), 50, 100);
}
function scoreBodyFit(car, profile) {
    let score = 60;
    switch(profile.whoFor){
        case "solo":
            score = car.seating === 5 ? 90 : 60;
            if (car.bodyType === "hatchback") score += 10;
            else if (car.bodyType === "sedan") score += 5;
            if (car.bodyType === "MUV") score -= 10;
            break;
        case "couple":
            score = car.seating === 5 ? 88 : 65;
            if (car.bodyType === "sedan" || car.bodyType === "SUV") score += 8;
            if (car.bootSpace >= 350) score += 4;
            break;
        case "small-family":
            score = car.seating === 7 ? 88 : 82;
            if (car.bodyType === "sedan" || car.bodyType === "SUV") score += 8;
            if (car.bootSpace >= 350) score += 4;
            break;
        case "big-family":
            score = car.seating === 7 ? 95 : 60;
            if (car.bodyType === "SUV" || car.bodyType === "MUV") score += 10;
            if (car.bootSpace >= 350) score += 5;
            break;
    }
    return clamp(score, 0, 100);
}
function normalizedEfficiency(car) {
    if (car.fuel === "electric") {
        // car.mileage holds full-charge range (km) for EVs, a different scale than km/l
        return clamp((car.mileage - 150) / (450 - 150) * 100, 0, 100);
    }
    return clamp((car.mileage - 10) / (28 - 10) * 100, 0, 100);
}
function cityUsageScore(car) {
    const efficiency = normalizedEfficiency(car);
    const maneuverability = car.bodyType === "hatchback" ? 100 : car.bodyType === "sedan" ? 85 : car.bodyType === "SUV" ? 65 : 50;
    return efficiency * 0.65 + maneuverability * 0.35;
}
function highwayUsageScore(car) {
    const safety = car.safetyRating / 5 * 100;
    const size = car.bodyType === "SUV" || car.bodyType === "MUV" ? 100 : car.bodyType === "sedan" ? 75 : 45;
    const bootBonus = clamp(car.bootSpace / 550 * 100, 0, 100);
    return safety * 0.45 + size * 0.35 + bootBonus * 0.2;
}
function offRoadUsageScore(car) {
    const bodyBonus = car.bodyType === "SUV" ? 100 : car.bodyType === "MUV" ? 80 : car.bodyType === "sedan" ? 30 : 20;
    const safety = car.safetyRating / 5 * 100;
    return bodyBonus * 0.7 + safety * 0.3;
}
function scoreUsageFit(car, profile) {
    switch(profile.usage){
        case "city":
            return cityUsageScore(car);
        case "highway":
            return highwayUsageScore(car);
        case "off-road":
            return offRoadUsageScore(car);
        case "mixed":
            return (cityUsageScore(car) + highwayUsageScore(car)) / 2;
    }
}
const RELATED_FUELS = {
    petrol: [
        "hybrid",
        "CNG"
    ],
    diesel: [
        "hybrid"
    ],
    CNG: [
        "petrol"
    ],
    hybrid: [
        "petrol",
        "electric"
    ],
    electric: [
        "hybrid"
    ]
};
function scoreFuelFit(car, profile) {
    let score;
    if (profile.fuelPreference === "any") {
        score = 70;
    } else if (car.fuel === profile.fuelPreference) {
        score = 100;
    } else {
        score = RELATED_FUELS[profile.fuelPreference]?.includes(car.fuel) ? 60 : 35;
    }
    const isEfficientFuel = car.fuel === "CNG" || car.fuel === "hybrid" || car.fuel === "electric";
    if (profile.usage === "city" && isEfficientFuel) {
        score = Math.min(100, score + 10);
    }
    return clamp(score, 0, 100);
}
function scoreSafety(car) {
    return car.safetyRating / 5 * 100;
}
function scoreCar(car, profile) {
    const weights = getWeights(profile.priority);
    const components = {
        budgetFit: scoreBudgetFit(car, profile),
        bodyFit: scoreBodyFit(car, profile),
        usageFit: scoreUsageFit(car, profile),
        fuelFit: scoreFuelFit(car, profile),
        safety: scoreSafety(car)
    };
    const total = Object.keys(components).reduce((sum, dim)=>sum + components[dim] * weights[dim], 0);
    return {
        score: Math.round(clamp(total, 0, 100)),
        components
    };
}
function formatLakhs(amount) {
    return `₹${(amount / 100000).toFixed(1)}L`;
}
function describeBudget(car, budget) {
    const headroom = budget - car.price;
    const closeness = headroom > budget * 0.2 ? "well within" : "close to";
    return `priced at ${formatLakhs(car.price)}, ${closeness} your ${formatLakhs(budget)} budget`;
}
const WHO_FOR_LABEL = {
    solo: "solo daily driving",
    couple: "comfortable trips for two",
    "small-family": "a small family",
    "big-family": "a big family"
};
function describeUsage(car, usage) {
    if (usage === "city") {
        return car.fuel === "electric" ? `${car.mileage}km range suits city driving` : `${car.mileage}km/l mileage keeps city running costs low`;
    }
    if (usage === "highway") {
        return `${car.safetyRating}/5 safety and a ${car.bootSpace}L boot suit long highway drives`;
    }
    if (usage === "off-road") {
        return `${car.bodyType} build handles rough terrain confidently`;
    }
    return "balances mileage and comfort for mixed city/highway use";
}
function describeFuel(car, profile) {
    if (profile.fuelPreference === "any" || car.fuel === profile.fuelPreference) {
        return `runs on ${car.fuel}`;
    }
    return `runs on ${car.fuel}, a close alternative to your ${profile.fuelPreference} preference`;
}
function buildReason(car, profile, components) {
    const fragments = {
        budgetFit: describeBudget(car, profile.budget),
        bodyFit: `${car.seating}-seat ${car.bodyType} fits ${WHO_FOR_LABEL[profile.whoFor]}`,
        usageFit: describeUsage(car, profile.usage),
        fuelFit: describeFuel(car, profile),
        safety: `${car.safetyRating}/5 safety rating`
    };
    const priorityDimension = PRIORITY_TO_DIMENSION[profile.priority];
    const remainingRanked = Object.keys(components).filter((dim)=>dim !== priorityDimension).sort((a, b)=>components[b] - components[a]);
    const orderedDimensions = [
        priorityDimension,
        ...remainingRanked
    ].slice(0, 3);
    return `${car.make} ${car.model} ${car.variant} — ${orderedDimensions.map((dim)=>fragments[dim]).join("; ")}.`;
}
function recommend(cars, profile, limit = 5) {
    return cars.filter((car)=>car.price <= profile.budget).map((car)=>{
        const { score, components } = scoreCar(car, profile);
        return {
            car,
            score,
            reason: buildReason(car, profile, components)
        };
    }).sort((a, b)=>b.score - a.score).slice(0, limit);
}
}),
"[project]/data/cars.json.[json].cjs [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = [
    {
        "id": "maruti-alto-k10-vxi",
        "make": "Maruti Suzuki",
        "model": "Alto K10",
        "variant": "VXI",
        "price": 550000,
        "bodyType": "hatchback",
        "fuel": "petrol",
        "transmission": "manual",
        "seating": 5,
        "mileage": 24.39,
        "safetyRating": 2,
        "bootSpace": 214,
        "useCaseTags": [
            "first car",
            "city commute",
            "budget-friendly",
            "easy to park"
        ]
    },
    {
        "id": "maruti-wagonr-cng-lxi",
        "make": "Maruti Suzuki",
        "model": "WagonR",
        "variant": "LXI CNG",
        "price": 680000,
        "bodyType": "hatchback",
        "fuel": "CNG",
        "transmission": "manual",
        "seating": 5,
        "mileage": 25.51,
        "safetyRating": 2,
        "bootSpace": 341,
        "useCaseTags": [
            "daily commute",
            "low running cost",
            "fleet/cab use",
            "tall boy hatchback"
        ]
    },
    {
        "id": "tata-tiago-xzplus",
        "make": "Tata",
        "model": "Tiago",
        "variant": "XZ+",
        "price": 780000,
        "bodyType": "hatchback",
        "fuel": "petrol",
        "transmission": "manual",
        "seating": 5,
        "mileage": 19.01,
        "safetyRating": 4,
        "bootSpace": 242,
        "useCaseTags": [
            "safety-conscious first car",
            "city commute",
            "value for money"
        ]
    },
    {
        "id": "maruti-swift-zxi",
        "make": "Maruti Suzuki",
        "model": "Swift",
        "variant": "ZXI",
        "price": 750000,
        "bodyType": "hatchback",
        "fuel": "petrol",
        "transmission": "manual",
        "seating": 5,
        "mileage": 22.0,
        "safetyRating": 2,
        "bootSpace": 265,
        "useCaseTags": [
            "fun to drive",
            "city commute",
            "college/first job"
        ]
    },
    {
        "id": "hyundai-i20-sportz",
        "make": "Hyundai",
        "model": "i20",
        "variant": "Sportz",
        "price": 900000,
        "bodyType": "hatchback",
        "fuel": "petrol",
        "transmission": "manual",
        "seating": 5,
        "mileage": 20.28,
        "safetyRating": 3,
        "bootSpace": 311,
        "useCaseTags": [
            "premium hatchback",
            "city commute",
            "tech features"
        ]
    },
    {
        "id": "tata-altroz-xz",
        "make": "Tata",
        "model": "Altroz",
        "variant": "XZ",
        "price": 850000,
        "bodyType": "hatchback",
        "fuel": "petrol",
        "transmission": "manual",
        "seating": 5,
        "mileage": 19.3,
        "safetyRating": 5,
        "bootSpace": 345,
        "useCaseTags": [
            "safety-first",
            "family hatchback",
            "large boot"
        ]
    },
    {
        "id": "maruti-dzire-zxi",
        "make": "Maruti Suzuki",
        "model": "Dzire",
        "variant": "ZXI",
        "price": 870000,
        "bodyType": "sedan",
        "fuel": "petrol",
        "transmission": "manual",
        "seating": 5,
        "mileage": 22.61,
        "safetyRating": 4,
        "bootSpace": 378,
        "useCaseTags": [
            "compact sedan",
            "cab/fleet use",
            "highway trips"
        ]
    },
    {
        "id": "hyundai-aura-sx-cng",
        "make": "Hyundai",
        "model": "Aura",
        "variant": "SX CNG",
        "price": 920000,
        "bodyType": "sedan",
        "fuel": "CNG",
        "transmission": "manual",
        "seating": 5,
        "mileage": 27.4,
        "safetyRating": 3,
        "bootSpace": 402,
        "useCaseTags": [
            "low running cost",
            "compact sedan",
            "daily commute"
        ]
    },
    {
        "id": "honda-amaze-vx-cvt",
        "make": "Honda",
        "model": "Amaze",
        "variant": "VX CVT",
        "price": 1100000,
        "bodyType": "sedan",
        "fuel": "petrol",
        "transmission": "automatic",
        "seating": 5,
        "mileage": 18.6,
        "safetyRating": 4,
        "bootSpace": 420,
        "useCaseTags": [
            "easy city driving",
            "family sedan",
            "reliable"
        ]
    },
    {
        "id": "skoda-slavia-ambition",
        "make": "Skoda",
        "model": "Slavia",
        "variant": "Ambition",
        "price": 1150000,
        "bodyType": "sedan",
        "fuel": "petrol",
        "transmission": "manual",
        "seating": 5,
        "mileage": 18.7,
        "safetyRating": 5,
        "bootSpace": 521,
        "useCaseTags": [
            "highway comfort",
            "safety-first",
            "european build quality"
        ]
    },
    {
        "id": "honda-city-v-cvt",
        "make": "Honda",
        "model": "City",
        "variant": "V CVT",
        "price": 1350000,
        "bodyType": "sedan",
        "fuel": "petrol",
        "transmission": "automatic",
        "seating": 5,
        "mileage": 18.4,
        "safetyRating": 4,
        "bootSpace": 506,
        "useCaseTags": [
            "family sedan",
            "highway trips",
            "comfortable rear seat"
        ]
    },
    {
        "id": "hyundai-verna-sx-o",
        "make": "Hyundai",
        "model": "Verna",
        "variant": "SX(O)",
        "price": 1650000,
        "bodyType": "sedan",
        "fuel": "petrol",
        "transmission": "automatic",
        "seating": 5,
        "mileage": 20.4,
        "safetyRating": 4,
        "bootSpace": 528,
        "useCaseTags": [
            "premium sedan",
            "highway trips",
            "tech features"
        ]
    },
    {
        "id": "maruti-grand-vitara-hybrid-zxiplus",
        "make": "Maruti Suzuki",
        "model": "Grand Vitara",
        "variant": "ZXI+ Hybrid",
        "price": 1930000,
        "bodyType": "SUV",
        "fuel": "hybrid",
        "transmission": "automatic",
        "seating": 5,
        "mileage": 27.97,
        "safetyRating": 3,
        "bootSpace": 373,
        "useCaseTags": [
            "fuel efficient SUV",
            "city and highway",
            "low running cost"
        ]
    },
    {
        "id": "maruti-brezza-zxi",
        "make": "Maruti Suzuki",
        "model": "Brezza",
        "variant": "ZXI",
        "price": 1050000,
        "bodyType": "SUV",
        "fuel": "petrol",
        "transmission": "manual",
        "seating": 5,
        "mileage": 19.8,
        "safetyRating": 4,
        "bootSpace": 328,
        "useCaseTags": [
            "compact SUV",
            "city commute",
            "first SUV"
        ]
    },
    {
        "id": "tata-nexon-ev-prime-xzplus",
        "make": "Tata",
        "model": "Nexon EV",
        "variant": "Prime XZ+",
        "price": 1650000,
        "bodyType": "SUV",
        "fuel": "electric",
        "transmission": "automatic",
        "seating": 5,
        "mileage": 312,
        "safetyRating": 5,
        "bootSpace": 350,
        "useCaseTags": [
            "zero emission",
            "city commute",
            "low running cost"
        ]
    },
    {
        "id": "tata-nexon-xzplus",
        "make": "Tata",
        "model": "Nexon",
        "variant": "XZ+",
        "price": 1090000,
        "bodyType": "SUV",
        "fuel": "petrol",
        "transmission": "manual",
        "seating": 5,
        "mileage": 17.44,
        "safetyRating": 5,
        "bootSpace": 350,
        "useCaseTags": [
            "safety-first SUV",
            "family SUV",
            "city and highway"
        ]
    },
    {
        "id": "hyundai-venue-sx",
        "make": "Hyundai",
        "model": "Venue",
        "variant": "SX",
        "price": 1120000,
        "bodyType": "SUV",
        "fuel": "petrol",
        "transmission": "manual",
        "seating": 5,
        "mileage": 18.15,
        "safetyRating": 3,
        "bootSpace": 350,
        "useCaseTags": [
            "compact SUV",
            "tech features",
            "city commute"
        ]
    },
    {
        "id": "kia-sonet-htx",
        "make": "Kia",
        "model": "Sonet",
        "variant": "HTX",
        "price": 1080000,
        "bodyType": "SUV",
        "fuel": "petrol",
        "transmission": "manual",
        "seating": 5,
        "mileage": 18.2,
        "safetyRating": 3,
        "bootSpace": 385,
        "useCaseTags": [
            "compact SUV",
            "sporty styling",
            "first SUV"
        ]
    },
    {
        "id": "hyundai-creta-sx",
        "make": "Hyundai",
        "model": "Creta",
        "variant": "SX",
        "price": 1750000,
        "bodyType": "SUV",
        "fuel": "petrol",
        "transmission": "automatic",
        "seating": 5,
        "mileage": 16.8,
        "safetyRating": 5,
        "bootSpace": 433,
        "useCaseTags": [
            "family SUV",
            "highway trips",
            "best seller"
        ]
    },
    {
        "id": "kia-seltos-htxplus",
        "make": "Kia",
        "model": "Seltos",
        "variant": "HTX+",
        "price": 1800000,
        "bodyType": "SUV",
        "fuel": "petrol",
        "transmission": "automatic",
        "seating": 5,
        "mileage": 16.5,
        "safetyRating": 3,
        "bootSpace": 433,
        "useCaseTags": [
            "family SUV",
            "premium features",
            "highway trips"
        ]
    },
    {
        "id": "tata-harrier-xz",
        "make": "Tata",
        "model": "Harrier",
        "variant": "XZ",
        "price": 1950000,
        "bodyType": "SUV",
        "fuel": "diesel",
        "transmission": "manual",
        "seating": 5,
        "mileage": 16.8,
        "safetyRating": 5,
        "bootSpace": 445,
        "useCaseTags": [
            "highway trips",
            "safety-first",
            "big and imposing"
        ]
    },
    {
        "id": "mahindra-xuv700-ax5",
        "make": "Mahindra",
        "model": "XUV700",
        "variant": "AX5",
        "price": 1980000,
        "bodyType": "SUV",
        "fuel": "diesel",
        "transmission": "manual",
        "seating": 7,
        "mileage": 16.0,
        "safetyRating": 5,
        "bootSpace": 240,
        "useCaseTags": [
            "large family",
            "highway trips",
            "safety-first",
            "3-row SUV"
        ]
    },
    {
        "id": "maruti-ertiga-zxi",
        "make": "Maruti Suzuki",
        "model": "Ertiga",
        "variant": "ZXI",
        "price": 1080000,
        "bodyType": "MUV",
        "fuel": "petrol",
        "transmission": "manual",
        "seating": 7,
        "mileage": 20.51,
        "safetyRating": 3,
        "bootSpace": 209,
        "useCaseTags": [
            "large family",
            "3-row MUV",
            "budget-friendly"
        ]
    },
    {
        "id": "kia-carens-prestige",
        "make": "Kia",
        "model": "Carens",
        "variant": "Prestige",
        "price": 1450000,
        "bodyType": "MUV",
        "fuel": "diesel",
        "transmission": "manual",
        "seating": 7,
        "mileage": 21.3,
        "safetyRating": 3,
        "bootSpace": 216,
        "useCaseTags": [
            "large family",
            "3-row MUV",
            "highway trips"
        ]
    },
    {
        "id": "toyota-innova-crysta-gx",
        "make": "Toyota",
        "model": "Innova Crysta",
        "variant": "GX",
        "price": 2250000,
        "bodyType": "MUV",
        "fuel": "diesel",
        "transmission": "manual",
        "seating": 7,
        "mileage": 13.68,
        "safetyRating": 4,
        "bootSpace": 300,
        "useCaseTags": [
            "large family",
            "reliable",
            "resale value",
            "chauffeur driven"
        ]
    }
];
}),
"[project]/app/api/recommend/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$scoring$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/scoring.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$data$2f$cars$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/data/cars.json.[json].cjs [app-route] (ecmascript)");
;
;
const WHO_FOR_VALUES = [
    "solo",
    "couple",
    "small-family",
    "big-family"
];
const USAGE_VALUES = [
    "city",
    "highway",
    "mixed",
    "off-road"
];
const FUEL_VALUES = [
    "petrol",
    "diesel",
    "CNG",
    "hybrid",
    "electric"
];
const PRIORITY_VALUES = [
    "safety",
    "mileage",
    "space",
    "performance",
    "budget"
];
function isBuyerProfile(value) {
    if (typeof value !== "object" || value === null) return false;
    const profile = value;
    return typeof profile.budget === "number" && Number.isFinite(profile.budget) && profile.budget > 0 && WHO_FOR_VALUES.includes(profile.whoFor) && USAGE_VALUES.includes(profile.usage) && (profile.fuelPreference === "any" || FUEL_VALUES.includes(profile.fuelPreference)) && PRIORITY_VALUES.includes(profile.priority);
}
async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch  {
        return Response.json({
            error: "Request body must be valid JSON."
        }, {
            status: 400
        });
    }
    if (!isBuyerProfile(body)) {
        return Response.json({
            error: "Request body must be a valid BuyerProfile."
        }, {
            status: 400
        });
    }
    const results = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$scoring$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recommend"])(__TURBOPACK__imported__module__$5b$project$5d2f$data$2f$cars$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"], body);
    return Response.json(results);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1-yoo_l._.js.map