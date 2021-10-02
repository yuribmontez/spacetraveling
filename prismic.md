## Prismic CMS

After creating your repository go to the "Custom Types" tab, add a new one with the following settings:

- Type: Repeatable Type
- Name: posts

Fields:

 - UID - slug
 - KeyText - title
 - KeyText - subtitle
 - KeyText - author
 - Image - banner
 - Group - content
 - Group - content - KeyText - heading
 - Group - content - RichText - body

In the "Documents" tab it will be possible to add the posts.

To configure previews you will need to go to settings > Previews and add some Previews configuration:

- Website name: domain for your application - http://localhost:3000 - (in case of local development)

Link Resolver: /api/preview
