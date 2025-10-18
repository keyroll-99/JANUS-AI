import app from './app';
import config from './shared/config/config';

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});