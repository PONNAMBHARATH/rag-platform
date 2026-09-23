require("dotenv").config();

const {
    generateRagAnswer,
} = require("./services/rag/rag.service");

const test = async () => {
    const question =
        "How does term insurance provide financial protection?";

    const userId =
        "6a6e7e72-41aa-4e5f-bdd0-3d5ff5afeae7";

    console.log("Question:", question);

    const result = await generateRagAnswer({
        question,
        userId,
    });

    console.log("\nAnswer:\n");
    console.log(result.answer);

    console.log("\nSources:\n");
    console.log(JSON.stringify(result.sources, null, 2));
};

test().catch((error) => {
    console.error("RAG test failed:", error);
});