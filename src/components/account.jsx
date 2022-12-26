import './account.css';

import { useEffect, useState } from 'preact/hooks';

import enhanceContent from '../utils/enhance-content';
import shortenNumber from '../utils/shorten-number';
import store from '../utils/store';

import Avatar from './avatar';
import Icon from './icon';
import NameText from './name-text';

function Account({ account }) {
  const [uiState, setUIState] = useState('default');
  const isString = typeof account === 'string';
  const [info, setInfo] = useState(isString ? null : account);

  useEffect(() => {
    if (isString) {
      setUIState('loading');
      (async () => {
        try {
          const info = await masto.v1.accounts.lookup({
            acct: account,
            skip_webfinger: false,
          });
          setInfo(info);
          setUIState('default');
        } catch (e) {
          alert(e);
          setUIState('error');
        }
      })();
    }
  }, []);

  const {
    acct,
    avatar,
    avatarStatic,
    bot,
    createdAt,
    displayName,
    emojis,
    fields,
    followersCount,
    followingCount,
    group,
    header,
    headerStatic,
    id,
    lastStatusAt,
    locked,
    note,
    statusesCount,
    url,
    username,
  } = info || {};

  const [relationshipUIState, setRelationshipUIState] = useState('default');
  const [relationship, setRelationship] = useState(null);
  useEffect(() => {
    if (info) {
      const currentAccount = store.session.get('currentAccount');
      if (currentAccount === id) {
        // It's myself!
        return;
      }
      setRelationshipUIState('loading');
      (async () => {
        try {
          const relationships = await masto.v1.accounts.fetchRelationships([
            id,
          ]);
          console.log('fetched relationship', relationships);
          if (relationships.length) {
            setRelationship(relationships[0]);
          }
          setRelationshipUIState('default');
        } catch (e) {
          console.error(e);
          setRelationshipUIState('error');
        }
      })();
    }
  }, [info]);

  const {
    following,
    showingReblogs,
    notifying,
    followedBy,
    blocking,
    blockedBy,
    muting,
    mutingNotifications,
    requested,
    domainBlocking,
    endorsed,
  } = relationship || {};

  return (
    <div
      id="account-container"
      class={`sheet ${uiState === 'loading' ? 'skeleton' : ''}`}
    >
      {!info || uiState === 'loading' ? (
        <>
          <header>
            <Avatar size="xxxl" />
            ███ ████████████
          </header>
          <main>
            <div class="note">
              <p>████████ ███████</p>
              <p>███████████████ ███████████████</p>
            </div>
            <p class="stats">
              <span>██ Posts</span>
              <span>██ Following</span>
              <span>██ Followers</span>
            </p>
          </main>
        </>
      ) : (
        <>
          <header>
            <Avatar url={avatar} size="xxxl" />
            <NameText account={info} showAcct external />
          </header>
          <main>
            <div
              class="note"
              dangerouslySetInnerHTML={{
                __html: enhanceContent(note, { emojis }),
              }}
            />
            {fields?.length > 0 && (
              <div class="profile-metadata">
                {fields.map(({ name, value, verifiedAt }) => (
                  <div
                    class={`profile-field ${
                      verifiedAt ? 'profile-verified' : ''
                    }`}
                    key={name}
                  >
                    <b>
                      {name}{' '}
                      {!!verifiedAt && <Icon icon="check-circle" size="s" />}
                    </b>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: value,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            <p class="stats">
              <span>
                <b title={statusesCount}>{shortenNumber(statusesCount)}</b>{' '}
                Posts
              </span>
              <span>
                <b title={followingCount}>{shortenNumber(followingCount)}</b>{' '}
                Following
              </span>
              <span>
                <b title={followersCount}>{shortenNumber(followersCount)}</b>{' '}
                Followers
              </span>
              {!!createdAt && (
                <span>
                  Joined:{' '}
                  <b>
                    <time datetime={createdAt}>
                      {Intl.DateTimeFormat('en', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }).format(new Date(createdAt))}
                    </time>
                  </b>
                </span>
              )}
            </p>
            <p class="actions">
              {followedBy ? <span class="tag">Following you</span> : <span />}{' '}
              {relationshipUIState !== 'loading' && relationship && (
                <button
                  type="button"
                  class={`${following ? 'light' : ''} swap`}
                  data-swap-state="danger"
                  disabled={relationshipUIState === 'loading'}
                  onClick={() => {
                    setRelationshipUIState('loading');
                    (async () => {
                      try {
                        let newRelationship;
                        if (following) {
                          const yes = confirm(
                            'Are you sure that you want to unfollow this account?',
                          );
                          if (yes) {
                            newRelationship = await masto.v1.accounts.unfollow(
                              id,
                            );
                          }
                        } else {
                          newRelationship = await masto.v1.accounts.follow(id);
                        }
                        if (newRelationship) setRelationship(newRelationship);
                        setRelationshipUIState('default');
                      } catch (e) {
                        alert(e);
                        setRelationshipUIState('error');
                      }
                    })();
                  }}
                >
                  {following ? (
                    <>
                      <span>Following</span>
                      <span>Unfollow…</span>
                    </>
                  ) : (
                    'Follow'
                  )}
                  {/* {following ? 'Unfollow…' : 'Follow'} */}
                </button>
              )}
            </p>
          </main>
        </>
      )}
    </div>
  );
}

export default Account;
