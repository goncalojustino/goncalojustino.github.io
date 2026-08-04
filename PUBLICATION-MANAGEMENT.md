# Publication management

## First sync

After publishing these files, open the repository's **Actions** tab, choose **Sync ORCID Works**, then click **Run workflow**. The workflow reads only the public Works in ORCID and updates `data/orcid-works.json`.

## Choosing website publications

1. Open `publication-manager.html` on the published website.
2. Select the Works to show.
3. Add a short description, an image path such as `images/new-paper.jpg`, and an image description.
4. Click **Download selected publications**.
5. Replace `data/publications.json` in the repository with the downloaded file and commit it.

The preview page reads `data/publications.json`; the ORCID sync never overwrites this file. This keeps your selections and custom card content intact when new Works arrive.
