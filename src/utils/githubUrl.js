const extractOwnerAndRepo = (repoUrl) => {
    const regex = /https:\/\/github\.com\/([^/]+)\/([^/]+)/;
    const match = repoUrl.match(regex);

    if (match && match.length === 3) {
        return {
            owner: match[1],
            repoName: match[2],
        };
    } else {
        throw new Error('Invalid GitHub repository URL');
    }
};

export {extractOwnerAndRepo}