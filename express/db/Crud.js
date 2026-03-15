const express = require("express");

module.exports = function crudRouter(db) {
  const router = express.Router();
 
  router.get("/:collection", async (req, res) => {
    try {
      const { page, limit, sortField, sortOrder, ...filters } = req.query;
  
      const result = await db.paginate(req.params.collection, {
        page,
        limit,
        query: filters, // 👈 this was missing
        sort: sortField
          ? { [sortField]: sortOrder === "asc" ? 1 : -1 }
          : { _id: -1 }
      });
  
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.get("/:collection/all", async (req, res) =>
    res.json(await db.all(req.params.collection))
  );

  router.post("/:collection", async (req, res) => {
    res.json(await db.create(req.params.collection, req.body));
  });

  router.get("/:collection/:id", async (req, res) =>
    res.json(await db.read(req.params.collection, req.params.id))
  );

  router.put("/:collection/:id", async (req, res) =>
    res.json(await db.update(req.params.collection, req.params.id, req.body))
  );

  router.delete("/:collection/:id", async (req, res) =>
    res.json(await db.delete(req.params.collection, req.params.id))
  );

  return router;
};