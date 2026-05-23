const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.XSkbTi02.js",app:"_app/immutable/entry/app.1WAHdvQx.js",imports:["_app/immutable/entry/start.XSkbTi02.js","_app/immutable/chunks/BAgOblYg.js","_app/immutable/chunks/Df7qM_CQ.js","_app/immutable/chunks/1LyeEcT5.js","_app/immutable/entry/app.1WAHdvQx.js","_app/immutable/chunks/1LyeEcT5.js","_app/immutable/chunks/Df7qM_CQ.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CkPTnj9G.js","_app/immutable/chunks/BTyaZEhz.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-D9UlOoon.js')),
			__memo(() => import('./chunks/1-CmFK8axN.js')),
			__memo(() => import('./chunks/3-_6gsIh6q.js')),
			__memo(() => import('./chunks/4-BdCwVaXP.js')),
			__memo(() => import('./chunks/5-CjfYs-AY.js')),
			__memo(() => import('./chunks/7-DMn4tpid.js')),
			__memo(() => import('./chunks/8-yORvj4u8.js')),
			__memo(() => import('./chunks/9-gW6D_9n6.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/lib",
				pattern: /^\/lib\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/lib/login",
				pattern: /^\/lib\/login\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/lib/logout",
				pattern: /^\/lib\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-qK-MrzPi.js'))
			},
			{
				id: "/stats",
				pattern: /^\/stats\/?$/,
				params: [],
				page: { layouts: [0,3,], errors: [1,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/stats/api/v1/health",
				pattern: /^\/stats\/api\/v1\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-W7-Xygdj.js'))
			}
		],
		prerendered_routes: new Set(["/encik","/encik/__data.json"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set(["/encik","/encik/__data.json"]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
