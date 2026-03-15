const fs = require("fs");

class Cache {
    static async get({name, api, cache}) {
        const full_path = "./cache/" + name + ".json";
        if (! fs.existsSync(full_path) || cache !== undefined) {
            const res = await fetch(api);
            const data = await res.json();
            fs.writeFileSync(full_path, JSON.stringify(data, null, 2));
        }
        const data = JSON.parse(fs.readFileSync(full_path, "utf8"));
        return data;
    }
}

module.exports = Cache;