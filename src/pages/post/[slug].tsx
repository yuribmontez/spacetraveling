/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length; // all 'heading' words

    const words = contentItem.body.map(item => item.text.split(' ').length); // all 'body' words
    words.map(word => (total += word));

    return total;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);

  const formatedDate = format(new Date(post.first_publication_date), 'PP', {
    locale: ptBR,
  });

  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <img
        className={styles.postBanner}
        src={post.data.banner.url}
        alt="post banner"
      />
      <main className={commonStyles.container}>
        <div className={styles.postData}>
          <h1>{post.data.title}</h1>
          <ul>
            <li>
              <FiCalendar />
              {formatedDate}
            </li>
            <li>
              <FiUser />
              {post.data.author}
            </li>
            <li>
              <FiClock />
              {readTime} min
            </li>
          </ul>
        </div>

        {post.data.content.map(content => (
          <article key={content.heading} className={styles.postContent}>
            <>
              <h2>{content.heading}</h2>
              <p
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </>
          </article>
        ))}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {}
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          body: [...content.body],
          heading: content.heading,
        };
      }),
    },
  };

  return {
    props: { post },
  };
};
