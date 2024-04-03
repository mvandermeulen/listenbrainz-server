import React, { useCallback, useContext, useState } from "react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { toast } from "react-toastify";
import GlobalAppContext from "../../../utils/GlobalAppContext";
import { ToastMsg } from "../../../notifications/Notifications";
import Loader from "../../../components/Loader";

type ImportPLaylistModalProps = {
  listenlist: JSPFTrack[];
};

export default NiceModal.create((props: ImportPLaylistModalProps) => {
  const modal = useModal();

  const closeModal = React.useCallback(() => {
    modal.hide();
    document?.body?.classList?.remove("modal-open");
    setTimeout(modal.remove, 200);
  }, [modal]);

  const { APIService, currentUser } = React.useContext(GlobalAppContext);
  const [playlists, setPlaylists] = React.useState<SpotifyPlaylistObject[]>([]);
  const [loading, setLoading] = React.useState<string[]>([]);

  React.useEffect(() => {
    async function getUserPlaylistsFromSpotify() {
      try {
        const response = await APIService.importPlaylistToSpotify(
          currentUser?.auth_token
        );

        if (!response) {
          return;
        }

        setPlaylists(response);
      } catch (error) {
        toast.error(
          <ToastMsg
            title="Error loading playlists"
            message={error?.message ?? error}
          />,
          { toastId: "load-playlists-error" }
        );
      }
    }

    if (currentUser?.auth_token) {
      getUserPlaylistsFromSpotify();
    }
  }, [APIService, currentUser]);

  const alertMustBeLoggedIn = () => {
    toast.error(
      <ToastMsg
        title="Error"
        message="You must be logged in for this operation"
      />,
      { toastId: "auth-error" }
    );
  };

  const importTracksToPlaylist = async (
    playlistID: string,
    playlistName: string
  ) => {
    if (!currentUser?.auth_token) {
      alertMustBeLoggedIn();
      return;
    }

    if (loading.includes(playlistID)) {
      setLoading(loading.filter((i: string) => i !== playlistID));
    } else {
      setLoading([...loading, playlistID]);
    }

    try {
      const newPlaylist: JSPFPlaylist = await APIService.importSpotifyPlaylistTracks(
        currentUser?.auth_token,
        playlistID
      );
      toast.success(
        <ToastMsg
          title="Successfully imported playlist from Spotify"
          message={
            <>
              Imported
              <a href={newPlaylist.identifier}> {playlistName}</a>
            </>
          }
        />,
        { toastId: "create-playlist-success" }
      );
      setLoading(loading.filter((i: string) => i !== playlistID));
      modal.resolve(newPlaylist);
    } catch (error) {
      toast.error(
        <ToastMsg
          title="Something went wrong"
          message={<>We could not save your playlist: {error.toString()}</>}
        />,
        { toastId: "save-playlist-error" }
      );
      setLoading(loading.filter((i: string) => i !== playlistID));
    }
  };

  return (
    <div
      className={`modal fade ${modal.visible ? "in" : ""}`}
      id="ImportSpotifyPlaylistModal"
      tabIndex={-1}
      role="dialog"
      aria-labelledby="ImportSpotifyPlaylistLabel"
      data-backdrop="static"
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <button
              type="button"
              className="close"
              data-dismiss="modal"
              aria-label="Close"
              onClick={closeModal}
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <h4
              className="modal-title"
              id="ImportSpotifyPlaylistLabel"
              style={{ textAlign: "center" }}
            >
              Import playlist from Spotify
            </h4>
          </div>
          <div className="modal-body">
            <p className="text-muted">
              Add one or more of your Spotify playlists below:
            </p>
            <div
              className="list-group"
              style={{ maxHeight: "50vh", overflow: "scroll" }}
            >
              {playlists?.map((playlist: SpotifyPlaylistObject) => (
                <button
                  type="button"
                  key={playlist.id}
                  className="list-group-item"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                  name={playlist.name}
                  onClick={() =>
                    importTracksToPlaylist(playlist.id, playlist.name)
                  }
                >
                  <span>{playlist.name}</span>
                  {loading.includes(playlist.id) && (
                    <Loader
                      isLoading={!!loading}
                      style={{
                        maxHeight: "2vh",
                        paddingTop: "10px",
                        marginRight: "5px",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-default"
              data-dismiss="modal"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
